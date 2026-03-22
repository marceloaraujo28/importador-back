import * as XLSX from "xlsx";
import { classifyBbTransaction } from "../classification/classify-bb-transaction";
import type {
  BbAssignment,
  BbSignal,
} from "../classification/bb-assignment-rules";

export type BbParsedTransaction = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: Exclude<BbSignal, "*">;
  assignment: BbAssignment;
};

type ParseBancoBrasilExtratoInput = {
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

  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const amount = Number(normalized);

  if (Number.isNaN(amount)) {
    return null;
  }

  return amount;
}

function isValidSignal(
  value: string | number | null | undefined,
): value is "C" | "D" {
  if (value === null || value === undefined) return false;

  const signal = normalizeText(String(value));
  return signal === "C" || signal === "D";
}

function findHeaderRowIndex(rows: SheetRow[]): number {
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) =>
      normalizeText(String(cell ?? "")),
    );

    const hasData = normalizedCells.includes("DATA");
    const hasHistorico = normalizedCells.includes("HISTORICO");
    const hasValor = normalizedCells.some((cell) => cell.includes("VALOR"));
    const hasInf = normalizedCells.includes("INF.");

    return hasData && hasHistorico && hasValor && hasInf;
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
  const signalIndex = normalizedHeader.findIndex((cell) => cell === "INF.");

  return {
    dateIndex,
    descriptionIndex,
    amountIndex,
    signalIndex,
  };
}

function hasRequiredColumns(
  columns: ReturnType<typeof getColumnIndexes>,
): boolean {
  return (
    columns.dateIndex !== -1 &&
    columns.descriptionIndex !== -1 &&
    columns.amountIndex !== -1 &&
    columns.signalIndex !== -1
  );
}

function shouldIgnoreRow(description: string): boolean {
  const normalizedDescription = normalizeText(description);

  if (!normalizedDescription) {
    return true;
  }

  return normalizedDescription.startsWith("SALDO");
}

export function parseBancoBrasilExtrato(
  input: ParseBancoBrasilExtratoInput,
): BbParsedTransaction[] {
  const workbook = XLSX.read(input.buffer, { type: "buffer" });

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
  });

  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("Cabeçalho do extrato do Banco do Brasil não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco do Brasil não foram encontradas.",
    );
  }

  const transactions: BbParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    if (!row) {
      continue;
    }

    const date = String(row[columnIndexes.dateIndex] ?? "").trim();
    const description = String(
      row[columnIndexes.descriptionIndex] ?? "",
    ).trim();
    const amount = parseMoney(row[columnIndexes.amountIndex]);
    const signal = String(row[columnIndexes.signalIndex] ?? "").trim();

    if (!date || !description || amount === null || !isValidSignal(signal)) {
      continue;
    }

    if (shouldIgnoreRow(description)) {
      continue;
    }

    const assignment = classifyBbTransaction({
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
