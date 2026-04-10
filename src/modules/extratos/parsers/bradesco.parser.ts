import * as XLSX from "xlsx";
import { classifyBradescoTransaction } from "../classification/classify-bradesco-transaction";
import type {
  BradescoAssignment,
  BradescoSignal,
} from "../classification/bradesco-assignment-rules";

export type BradescoParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: Exclude<BradescoSignal, "*">;
  assignment: BradescoAssignment;
};

type ParseBradescoExtratoInput = {
  accountId: string;
  bankName: string;
  companyName: string;
  buffer: Buffer;
};

type SheetRow = Array<string | number | null | undefined>;

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  if (!text) return null;

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const amount = Number(text);
    return Number.isNaN(amount) ? null : amount;
  }

  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const amount = Number(normalized);

  return Number.isNaN(amount) ? null : amount;
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) =>
      normalizeText(String(cell ?? "")),
    );

    const hasDate = normalizedCells.includes("DATA");
    const hasLancamento = normalizedCells.includes("LANCAMENTO");
    const hasDocumento = normalizedCells.includes("DCTO.");
    const hasCredito = normalizedCells.some((cell) => cell.includes("CREDITO"));
    const hasDebito = normalizedCells.some((cell) => cell.includes("DEBITO"));
    const hasSaldo = normalizedCells.some((cell) => cell.includes("SALDO"));

    return (
      hasDate &&
      hasLancamento &&
      hasDocumento &&
      hasCredito &&
      hasDebito &&
      hasSaldo
    );
  });
}

function getColumnIndexes(headerRow: SheetRow) {
  const normalizedHeader = headerRow.map((cell) =>
    normalizeText(String(cell ?? "")),
  );

  const dateIndex = normalizedHeader.findIndex((cell) => cell === "DATA");
  const descriptionIndex = normalizedHeader.findIndex(
    (cell) => cell === "LANCAMENTO",
  );
  const creditIndex = normalizedHeader.findIndex((cell) =>
    cell.includes("CREDITO"),
  );
  const debitIndex = normalizedHeader.findIndex((cell) =>
    cell.includes("DEBITO"),
  );

  return {
    dateIndex,
    descriptionIndex,
    creditIndex,
    debitIndex,
  };
}

function hasRequiredColumns(
  columns: ReturnType<typeof getColumnIndexes>,
): boolean {
  return (
    columns.dateIndex !== -1 &&
    columns.descriptionIndex !== -1 &&
    columns.creditIndex !== -1 &&
    columns.debitIndex !== -1
  );
}

function getWorksheetCellEntry(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  columnIndex: number,
) {
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
  const coordinates = {
    r: range.s.r + rowIndex,
    c: range.s.c + columnIndex,
  };
  const address = XLSX.utils.encode_cell(coordinates);

  return {
    cell: worksheet[address],
  };
}

function formatExcelSerialDate(
  value: number,
  formatCode?: string | null,
): string | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const wholeDays = Math.round(value);

  if (wholeDays <= 0) {
    return null;
  }

  const excelEpochUtc = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpochUtc + wholeDays * 24 * 60 * 60 * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const normalizedFormat = String(formatCode ?? "").toLowerCase();

  if (normalizedFormat.includes("m/d")) {
    return `${month}/${day}/${year}`;
  }

  return `${day}/${month}/${year}`;
}

function getCellDisplayValue(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  columnIndex: number,
): string {
  const { cell } = getWorksheetCellEntry(worksheet, rowIndex, columnIndex);

  if (!cell) {
    return "";
  }

  if (cell.w !== undefined && cell.w !== null) {
    return String(cell.w).trim();
  }

  if (cell.v !== undefined && cell.v !== null) {
    return String(cell.v).trim();
  }

  return "";
}

function getCellDateValue(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  columnIndex: number,
): string {
  const { cell } = getWorksheetCellEntry(worksheet, rowIndex, columnIndex);

  if (!cell) {
    return "";
  }

  if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
    const formattedDate = formatExcelSerialDate(
      cell.v,
      typeof cell.z === "string" ? cell.z : null,
    );

    if (formattedDate) {
      return formattedDate;
    }
  }

  if (cell.w !== undefined && cell.w !== null) {
    return String(cell.w).trim();
  }

  if (cell.v !== undefined && cell.v !== null) {
    return String(cell.v).trim();
  }

  return "";
}

function getCellNumericValue(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const { cell } = getWorksheetCellEntry(worksheet, rowIndex, columnIndex);

  if (!cell) {
    return null;
  }

  if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
    return cell.v;
  }

  return null;
}

function shouldStopAtRow(row: SheetRow): boolean {
  const normalizedRow = row
    .map((cell) => normalizeText(String(cell ?? "")))
    .join(" ");

  return normalizedRow.includes("SALDOS INVEST FACIL / PLUS");
}

function shouldIgnoreRow(description: string): boolean {
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) {
    return true;
  }

  return normalizedDescription.startsWith("SALDO");
}

export function parseBradescoExtrato(
  input: ParseBradescoExtratoInput,
): BradescoParsedTransaction[] {
  const workbook = XLSX.read(input.buffer, {
    type: "buffer",
    cellText: true,
    cellNF: true,
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Nenhuma planilha encontrada no arquivo.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error("Planilha não encontrada no arquivo.");
  }

  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("Cabeçalho do extrato do Banco Bradesco não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Bradesco não foram encontradas.",
    );
  }

  const transactions: BradescoParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    if (!row) {
      continue;
    }

    if (shouldStopAtRow(row)) {
      break;
    }

    const date =
      getCellDateValue(worksheet, index, columnIndexes.dateIndex) ||
      String(row[columnIndexes.dateIndex] ?? "").trim();
    const description =
      getCellDisplayValue(worksheet, index, columnIndexes.descriptionIndex) ||
      String(row[columnIndexes.descriptionIndex] ?? "").trim();

    const numericCredit = getCellNumericValue(
      worksheet,
      index,
      columnIndexes.creditIndex,
    );
    const numericDebit = getCellNumericValue(
      worksheet,
      index,
      columnIndexes.debitIndex,
    );

    const parsedCredit =
      numericCredit ??
      parseMoney(
        getCellDisplayValue(worksheet, index, columnIndexes.creditIndex) ||
          row[columnIndexes.creditIndex],
      );
    const parsedDebit =
      numericDebit ??
      parseMoney(
        getCellDisplayValue(worksheet, index, columnIndexes.debitIndex) ||
          row[columnIndexes.debitIndex],
      );

    if (!date || !description) {
      continue;
    }

    if (shouldIgnoreRow(description)) {
      continue;
    }

    let signal: "C" | "D" | null = null;
    let amount: number | null = null;

    if (parsedCredit !== null && parsedCredit !== 0) {
      signal = "C";
      amount = Math.abs(parsedCredit);
    } else if (parsedDebit !== null && parsedDebit !== 0) {
      signal = "D";
      amount = Math.abs(parsedDebit);
    }

    if (!signal || amount === null) {
      continue;
    }

    const assignment = classifyBradescoTransaction({
      description,
      signal,
    });

    if (assignment === "IGNORAR") {
      continue;
    }

    transactions.push({
      accountId: input.accountId,
      bankName: input.bankName,
      companyName: input.companyName,
      date,
      description,
      amount,
      signal,
      assignment,
    });
  }

  return transactions;
}
