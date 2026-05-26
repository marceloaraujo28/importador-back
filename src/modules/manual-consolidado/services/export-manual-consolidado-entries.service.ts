import XLSX from "xlsx";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import type {
  ManualConsolidadoAssignmentLabel,
  ManualConsolidadoStatusFilter,
} from "../manual-consolidado.types";
import {
  mapAssignmentToPrisma,
  mapStatusFilterToPrisma,
} from "../manual-consolidado.types";
import { normalizeManualConsolidadoDate } from "../utils/manual-consolidado-date";
import { mapManualConsolidadoEntryResponse } from "../utils/manual-consolidado-response";

type ExportManualConsolidadoEntriesInput = {
  dateOrder: "asc" | "desc";
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignmentLabel[];
  status?: ManualConsolidadoStatusFilter;
};

type ExportRow = {
  ID: string;
  Empresa: string;
  Data: string;
  Montante: number;
  Histórico: string;
  Atribuição: string;
  Status: string;
};

function getDateKeyOrUndefined(date?: string) {
  if (!date) {
    return undefined;
  }

  return normalizeManualConsolidadoDate(date).dateKey;
}

export async function exportManualConsolidadoEntries(
  input: ExportManualConsolidadoEntriesInput,
) {
  const dateFromKey = getDateKeyOrUndefined(input.dateFrom);
  const dateToKey = getDateKeyOrUndefined(input.dateTo);
  const accountIds = input.accountIds?.filter(Boolean) ?? [];
  const assignments =
    input.assignment?.map((assignment) => mapAssignmentToPrisma(assignment)) ??
    [];
  const status = mapStatusFilterToPrisma(input.status);

  const where: Prisma.ManualConsolidadoEntryWhereInput = {
    ...(assignments.length ? { assignment: { in: assignments } } : {}),
    ...(status ? { status } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.description
      ? {
          description: {
            contains: input.description,
          },
        }
      : {}),
    ...(dateFromKey || dateToKey
      ? {
          dateKey: {
            ...(dateFromKey ? { gte: dateFromKey } : {}),
            ...(dateToKey ? { lte: dateToKey } : {}),
          },
        }
      : {}),
    ...(accountIds.length
      ? {
          account: {
            code: {
              in: accountIds,
            },
          },
        }
      : {}),
  };

  const entries = await prisma.manualConsolidadoEntry.findMany({
    where,
    orderBy: [{ dateKey: input.dateOrder }, { createdAt: "desc" }],
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  const mappedEntries = entries.map(mapManualConsolidadoEntryResponse);

  const rows: ExportRow[] = mappedEntries.map((entry) => ({
    ID: entry.accountId,
    Empresa: entry.companyName,
    Data: entry.date,
    Montante: entry.amount,
    Histórico: entry.description,
    Atribuição:
      entry.assignment === "TRANSFERENCIA_EC"
        ? `${entry.assignment} (${entry.transferDirection === "ENTRADA" ? "C" : "D"})`
        : entry.assignment,
    Status: entry.status,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 40 },
    { wch: 24 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Registros Manuais");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
}
