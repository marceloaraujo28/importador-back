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

type ListManualConsolidadoEntriesInput = {
  page: number;
  pageSize: number;
  dateOrder: "asc" | "desc";
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignmentLabel[];
  status?: ManualConsolidadoStatusFilter;
};

function getDateKeyOrUndefined(date?: string) {
  if (!date) {
    return undefined;
  }

  return normalizeManualConsolidadoDate(date).dateKey;
}

export async function listManualConsolidadoEntries(
  input: ListManualConsolidadoEntriesInput,
) {
  const requestedPage = Math.max(1, input.page);
  const pageSize = Math.max(1, Math.min(100, input.pageSize));
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

  const [totalItems, filteredAmountAggregate] = await Promise.all([
    prisma.manualConsolidadoEntry.count({ where }),
    prisma.manualConsolidadoEntry.aggregate({
      where,
      _sum: {
        amount: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const entries = await prisma.manualConsolidadoEntry.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: [{ dateKey: input.dateOrder }, { createdAt: "desc" }],
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  return {
    data: entries.map(mapManualConsolidadoEntryResponse),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      filteredAmount: Number(filteredAmountAggregate._sum.amount ?? 0),
    },
  };
}
