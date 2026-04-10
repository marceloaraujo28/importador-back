import * as XLSX from "xlsx";
import { classifyBradescoTrianonTransaction } from "../classification/classify-bradesco-trianon-transaction";
import type {
  BradescoTrianonAssignment,
  BradescoTrianonSignal,
} from "../classification/bradesco-trianon-assignment-rules";

export type BradescoTrianonParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: Exclude<BradescoTrianonSignal, "*">;
  assignment: BradescoTrianonAssignment;
};

type ParseBradescoTrianonExtratoInput = {
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

    const hasBanco = normalizedCells.includes("BANCO");
    const hasConta = normalizedCells.includes("CONTA");
    const hasTitular = normalizedCells.includes("TITULAR");
    const hasDate = normalizedCells.includes("DATA");
    const hasHistorico = normalizedCells.includes("HISTORICO");
    const hasDocumento = normalizedCells.includes("DOCUMENTO");
    const hasFavorecido = normalizedCells.includes("FAVORECIDO");
    const hasValor = normalizedCells.includes("VALOR");
    const hasSaldo = normalizedCells.includes("SALDO");

    return (
      hasBanco &&
      hasConta &&
      hasTitular &&
      hasDate &&
      hasHistorico &&
      hasDocumento &&
      hasFavorecido &&
      hasValor &&
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
    (cell) => cell === "HISTORICO",
  );
  const amountIndex = normalizedHeader.findIndex((cell) => cell === "VALOR");

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

function normalizeYear(yearText: string): string {
  if (yearText.length === 4) {
    return yearText;
  }

  const year = Number(yearText);

  if (Number.isNaN(year)) {
    return yearText;
  }

  return year >= 70 ? `19${yearText}` : `20${yearText}`;
}

function parseFormattedDateText(
  value: string,
  formatCode?: string | null,
): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (!match) {
    return null;
  }

  const [, part1, part2, part3] = match;
  const normalizedFormat = String(formatCode ?? "").toLowerCase();
  const isMonthFirst = normalizedFormat.includes("m/d");
  const day = String(isMonthFirst ? part2 : part1).padStart(2, "0");
  const month = String(isMonthFirst ? part1 : part2).padStart(2, "0");
  const year = normalizeYear(part3);

  return `${day}/${month}/${year}`;
}

function formatExcelSerialDate(value: number): string | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const wholeDays = Math.floor(value);

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

  const textDate = parseFormattedDateText(
    String(cell.w ?? cell.v ?? ""),
    typeof cell.z === "string" ? cell.z : null,
  );

  if (textDate) {
    return textDate;
  }

  if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
    const formattedDate = formatExcelSerialDate(cell.v);

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

export function parseBradescoTrianonExtrato(
  input: ParseBradescoTrianonExtratoInput,
): BradescoTrianonParsedTransaction[] {
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
    throw new Error(
      "Cabeçalho do extrato do Banco Bradesco Trianon não encontrado.",
    );
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Bradesco Trianon não foram encontradas.",
    );
  }

  const transactions: BradescoTrianonParsedTransaction[] = [];

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

    const assignment = classifyBradescoTrianonTransaction({
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
      amount: Math.abs(parsedAmount),
      signal,
      assignment,
    });
  }

  return transactions;
}
