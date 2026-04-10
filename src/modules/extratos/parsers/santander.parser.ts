import * as XLSX from "xlsx";
import { classifySantanderTransaction } from "../classification/classify-santander-transaction";
import type {
  SantanderAssignment,
  SantanderSignal,
} from "../classification/santander-assignment-rules";

export type SantanderParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: Exclude<SantanderSignal, "*">;
  assignment: SantanderAssignment;
};

type ParseSantanderExtratoInput = {
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

function getSignalFromAmount(amount: number): "C" | "D" | null {
  if (amount > 0) return "C";
  if (amount < 0) return "D";
  return null;
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) =>
      normalizeText(String(cell ?? "")),
    );

    const hasDate = normalizedCells.includes("DATA");
    const hasHistorico = normalizedCells.includes("HISTORICO");
    const hasDocumento = normalizedCells.includes("DOCUMENTO");
    const hasValor = normalizedCells.some((cell) => cell.includes("VALOR"));
    const hasSaldo = normalizedCells.some((cell) => cell.includes("SALDO"));

    return hasDate && hasHistorico && hasDocumento && hasValor && hasSaldo;
  });
}

function getColumnIndexes(headerRow: SheetRow) {
  const normalizedHeader = headerRow.map((cell) =>
    normalizeText(String(cell ?? "")),
  );

  const dateIndex = normalizedHeader.findIndex((cell) => cell === "DATA");
  const descriptionIndex = normalizedHeader.findIndex(
    (cell) => cell === "HISTORICO",
  );
  const amountIndex = normalizedHeader.findIndex((cell) =>
    cell.includes("VALOR"),
  );

  return {
    dateIndex,
    descriptionIndex,
    amountIndex,
  };
}

function hasRequiredColumns(
  columns: ReturnType<typeof getColumnIndexes>,
): boolean {
  return (
    columns.dateIndex !== -1 &&
    columns.descriptionIndex !== -1 &&
    columns.amountIndex !== -1
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

function shouldIgnoreRow(description: string): boolean {
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) {
    return true;
  }

  return normalizedDescription.startsWith("SALDO");
}

export function parseSantanderExtrato(
  input: ParseSantanderExtratoInput,
): SantanderParsedTransaction[] {
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
    throw new Error("Cabeçalho do extrato do Banco Santander não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Santander não foram encontradas.",
    );
  }

  const transactions: SantanderParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    if (!row) {
      continue;
    }

    const date =
      getCellDateValue(worksheet, index, columnIndexes.dateIndex) ||
      String(row[columnIndexes.dateIndex] ?? "").trim();
    const description =
      getCellDisplayValue(worksheet, index, columnIndexes.descriptionIndex) ||
      String(row[columnIndexes.descriptionIndex] ?? "").trim();
    const numericAmount = getCellNumericValue(
      worksheet,
      index,
      columnIndexes.amountIndex,
    );
    const parsedAmount =
      numericAmount ??
      parseMoney(
        getCellDisplayValue(worksheet, index, columnIndexes.amountIndex) ||
          row[columnIndexes.amountIndex],
      );

    if (!date || !description || parsedAmount === null) {
      continue;
    }

    if (shouldIgnoreRow(description)) {
      continue;
    }

    const signal = getSignalFromAmount(parsedAmount);

    if (!signal) {
      continue;
    }

    const assignment = classifySantanderTransaction({
      description,
      signal,
    });

    transactions.push({
      accountId: input.accountId,
      bankName: input.bankName,
      companyName: input.companyName,
      date,
      description,
      amount: Math.abs(parsedAmount),
      signal,
      assignment,
    });
  }

  return transactions;
}
