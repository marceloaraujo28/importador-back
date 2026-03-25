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

    if (isHeader) {
      console.log("[ITAU] HEADER_FOUND", {
        index,
        row,
        normalizedCells,
      });
    }

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
  console.log("[ITAU] START_PARSE", {
    accountId: input.accountId,
    bankName: input.bankName,
    companyName: input.companyName,
    bufferSize: input.buffer.length,
  });

  const workbook = XLSX.read(input.buffer, {
    type: "buffer",
    cellText: true,
    cellNF: true,
    cellDates: false,
  });

  console.log("[ITAU] SHEET_NAMES", workbook.SheetNames);

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Nenhuma planilha encontrada no arquivo.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error("Planilha não encontrada no arquivo.");
  }

  console.log("[ITAU] ORIGINAL_WORKSHEET_REF", worksheet["!ref"]);

  const worksheetKeys = Object.keys(worksheet).filter(
    (key) => !key.startsWith("!"),
  );
  console.log("[ITAU] WORKSHEET_KEYS_COUNT", worksheetKeys.length);
  console.log("[ITAU] WORKSHEET_KEYS_SAMPLE_START", worksheetKeys.slice(0, 20));
  console.log("[ITAU] WORKSHEET_KEYS_SAMPLE_END", worksheetKeys.slice(-20));

  const recomputedRange = recomputeWorksheetRange(worksheet);
  worksheet["!ref"] = recomputedRange;

  console.log("[ITAU] RECOMPUTED_WORKSHEET_REF", worksheet["!ref"]);

  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  console.log("[ITAU] ROWS_LENGTH", rows.length);
  console.log("[ITAU] ROWS_PREVIEW_START", rows.slice(0, 15));
  console.log("[ITAU] ROWS_PREVIEW_END", rows.slice(-15));

  const headerRowIndex = findHeaderRowIndex(rows);

  console.log("[ITAU] HEADER_ROW_INDEX", headerRowIndex);

  if (headerRowIndex === -1) {
    throw new Error("Cabeçalho do extrato do Banco Itaú não encontrado.");
  }

  const headerRow = rows[headerRowIndex];

  console.log("[ITAU] HEADER_ROW_RAW", headerRow);

  if (!headerRow) {
    throw new Error("Linha de cabeçalho não encontrada no extrato.");
  }

  const columnIndexes = getColumnIndexes(headerRow);

  console.log("[ITAU] COLUMN_INDEXES", columnIndexes);

  if (!hasRequiredColumns(columnIndexes)) {
    throw new Error(
      "As colunas obrigatórias do extrato do Banco Itaú não foram encontradas.",
    );
  }

  const transactions: ItauParsedTransaction[] = [];

  for (let index = headerRowIndex + 1; index < rows.length; index++) {
    const row = rows[index];

    console.log("[ITAU] RAW_ROW", {
      index,
      row,
      rowLength: row?.length ?? 0,
    });

    if (!row) {
      console.log("[ITAU] SKIP_NO_ROW", { index });
      continue;
    }

    const date = String(row[columnIndexes.dateIndex] ?? "").trim();
    const description = String(
      row[columnIndexes.descriptionIndex] ?? "",
    ).trim();
    const rawAmount = row[columnIndexes.amountIndex];
    const parsedAmount = parseMoney(rawAmount);

    console.log("[ITAU] ROW_READ", {
      index,
      date,
      description,
      rawAmount,
      parsedAmount,
      dateIndex: columnIndexes.dateIndex,
      descriptionIndex: columnIndexes.descriptionIndex,
      amountIndex: columnIndexes.amountIndex,
    });

    if (!date || !description || parsedAmount === null) {
      console.log("[ITAU] SKIP_INVALID_ROW", {
        index,
        reason: "date/description/parsedAmount inválido",
        date,
        description,
        rawAmount,
        parsedAmount,
      });
      continue;
    }

    if (shouldIgnoreRow(description)) {
      console.log("[ITAU] SKIP_IGNORED_ROW", {
        index,
        reason: "descrição ignorada",
        description,
      });
      continue;
    }

    const signal = getSignalFromAmount(parsedAmount);

    console.log("[ITAU] SIGNAL_RESULT", {
      index,
      parsedAmount,
      signal,
    });

    if (!signal) {
      console.log("[ITAU] SKIP_NO_SIGNAL", {
        index,
        parsedAmount,
      });
      continue;
    }

    const amount = Math.abs(parsedAmount);

    const assignment = classifyItauTransaction({
      description,
      signal,
    });

    console.log("[ITAU] CLASSIFICATION_RESULT", {
      index,
      description,
      signal,
      assignment,
      amount,
    });

    if (assignment === "IGNORAR") {
      console.log("[ITAU] SKIP_ASSIGNMENT_IGNORAR", {
        index,
        description,
        signal,
      });
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

    console.log("[ITAU] PUSH_TRANSACTION", {
      index,
      transaction,
    });

    transactions.push(transaction);
  }

  console.log("[ITAU] TOTAL_TRANSACTIONS", transactions.length);
  console.log("[ITAU] FINAL_TRANSACTIONS", transactions);

  return transactions;
}
