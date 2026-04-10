import * as XLSX from "xlsx";
import { classifySafraTransaction } from "../classification/classify-safra-transaction";
import type {
  SafraAssignment,
  SafraSignal,
} from "../classification/safra-assignment-rules";

export type SafraParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: Exclude<SafraSignal, "*">;
  assignment: SafraAssignment;
};

type ParseSafraExtratoInput = {
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

function normalizeLaunchSignal(
  value: string | number | null | undefined,
): "C" | "D" | null {
  const normalized = normalizeText(String(value ?? ""));

  if (normalized === "CREDITO") return "C";
  if (normalized === "DEBITO") return "D";

  return null;
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) =>
      normalizeText(String(cell ?? "")),
    );

    const hasDate = normalizedCells.includes("DATA");
    const hasSituation = normalizedCells.some((cell) =>
      cell.includes("SITUAC"),
    );
    const hasLaunchType = normalizedCells.some(
      (cell) => cell.includes("TIPO") && cell.includes("LANC"),
    );
    const hasLaunch = normalizedCells.some(
      (cell) =>
        cell.includes("LANC") &&
        !cell.includes("TIPO") &&
        !cell.includes("COMPLEMENTO"),
    );
    const hasValue = normalizedCells.some((cell) => cell.includes("VALOR"));

    return hasDate && hasLaunch && hasValue && (hasSituation || hasLaunchType);
  });
}

function getColumnIndexes(headerRow: SheetRow) {
  const normalizedHeader = headerRow.map((cell) =>
    normalizeText(String(cell ?? "")),
  );

  const dateIndex = normalizedHeader.findIndex((cell) => cell === "DATA");
  const launchTypeIndex = normalizedHeader.findIndex(
    (cell) => cell.includes("TIPO") && cell.includes("LANC"),
  );
  const descriptionIndex = normalizedHeader.findIndex(
    (cell) =>
      cell.includes("LANC") &&
      !cell.includes("TIPO") &&
      !cell.includes("COMPLEMENTO"),
  );
  const amountIndex = normalizedHeader.findIndex((cell) =>
    cell.includes("VALOR"),
  );

  return {
    dateIndex,
    launchTypeIndex,
    descriptionIndex,
    amountIndex,
  };
}

function hasRequiredColumns(
  columns: ReturnType<typeof getColumnIndexes>,
): boolean {
  return (
    columns.dateIndex !== -1 &&
    columns.launchTypeIndex !== -1 &&
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

function recomputeWorksheetRange(worksheet: XLSX.WorkSheet): string {
  const cellAddresses = Object.keys(worksheet).filter(
    (key) => !key.startsWith("!"),
  );

  if (!cellAddresses.length) {
    return worksheet["!ref"] ?? "A1:A1";
  }

  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxRow = 0;
  let maxCol = 0;

  for (const address of cellAddresses) {
    const decoded = XLSX.utils.decode_cell(address);

    if (decoded.r < minRow) minRow = decoded.r;
    if (decoded.c < minCol) minCol = decoded.c;
    if (decoded.r > maxRow) maxRow = decoded.r;
    if (decoded.c > maxCol) maxCol = decoded.c;
  }

  return XLSX.utils.encode_range({
    s: { r: minRow, c: minCol },
    e: { r: maxRow, c: maxCol },
  });
}

export function parseSafraExtrato(
  input: ParseSafraExtratoInput,
): SafraParsedTransaction[] {
  const workbook = XLSX.read(input.buffer, {
    type: "buffer",
    cellText: true,
    cellNF: true,
    cellDates: false,
  });

  if (!workbook.SheetNames.length) {
    throw new Error("Nenhuma planilha encontrada no arquivo.");
  }

  let worksheet: XLSX.WorkSheet | null = null;
  let rows: SheetRow[] = [];
  let headerRowIndex = -1;

  for (const sheetName of workbook.SheetNames) {
    const currentWorksheet = workbook.Sheets[sheetName];

    if (!currentWorksheet) {
      continue;
    }

    currentWorksheet["!ref"] = recomputeWorksheetRange(currentWorksheet);

    const currentRows = XLSX.utils.sheet_to_json<SheetRow>(currentWorksheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: true,
    });

    const currentHeaderRowIndex = findHeaderRowIndex(currentRows);

    if (currentHeaderRowIndex !== -1) {
      worksheet = currentWorksheet;
      rows = currentRows;
      headerRowIndex = currentHeaderRowIndex;
      break;
    }
  }

  if (!worksheet || headerRowIndex === -1) {
    throw new Error("Cabeçalho do extrato do Banco Safra não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Safra não foram encontradas.",
    );
  }

  const transactions: SafraParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    if (!row) {
      continue;
    }

    const date =
      getCellDateValue(worksheet, index, columnIndexes.dateIndex) ||
      String(row[columnIndexes.dateIndex] ?? "").trim();
    const signal = normalizeLaunchSignal(
      getCellDisplayValue(worksheet, index, columnIndexes.launchTypeIndex) ||
        row[columnIndexes.launchTypeIndex],
    );
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

    if (!date || !signal || !description || parsedAmount === null) {
      continue;
    }

    const assignment = classifySafraTransaction({
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
