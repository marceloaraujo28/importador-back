import * as XLSX from "xlsx";
import { classifyItauTransaction } from "../classification/classify-itau-transaction";
import type {
  ItauAssignment,
  ItauSignal,
} from "../classification/itau-assignment-rules";

export type ItauParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: ItauSignal;
  assignment: ItauAssignment;
};

type ParseItauExtratoInput = {
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

function getSignalFromAmount(amount: number): ItauSignal | null {
  if (amount > 0) return "C";
  if (amount < 0) return "D";
  return null;
}

function shouldIgnoreRow(description: string): boolean {
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) return true;

  return normalizedDescription.startsWith("SALDO");
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  return rows.findIndex((row, index) => {
    const normalizedCells = row.map((cell) =>
      normalizeText(String(cell ?? "")),
    );

    const hasDate = normalizedCells.includes("DATA");
    const hasLancamento = normalizedCells.includes("LANCAMENTO");
    const hasValor = normalizedCells.some((cell) => cell.includes("VALOR"));

    const isHeader = hasDate && hasLancamento && hasValor;

    return isHeader;
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

export function parseItauExtrato(
  input: ParseItauExtratoInput,
): ItauParsedTransaction[] {
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

  const worksheetKeys = Object.keys(worksheet).filter(
    (key) => !key.startsWith("!"),
  );

  const recomputedRange = recomputeWorksheetRange(worksheet);
  worksheet["!ref"] = recomputedRange;

  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("Cabeçalho do extrato do Banco Itaú não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Itaú não foram encontradas.",
    );
  }

  const transactions: ItauParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    if (!row) {
      continue;
    }

    const date = String(row[columnIndexes.dateIndex] ?? "").trim();
    const description = String(
      row[columnIndexes.descriptionIndex] ?? "",
    ).trim();
    const rawAmount = row[columnIndexes.amountIndex];
    const parsedAmount = parseMoney(rawAmount);

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

    const amount = Math.abs(parsedAmount);

    const assignment = classifyItauTransaction({
      description,
      signal,
    });

    if (assignment === "IGNORAR") {
      continue;
    }

    const transaction: ItauParsedTransaction = {
      accountId: input.accountId,
      bankName: input.bankName,
      companyName: input.companyName,
      date,
      description,
      amount,
      signal,
      assignment,
    };

    transactions.push(transaction);
  }

  return transactions;
}
