import { prisma } from "../../../lib/prisma";
import type { ManualConsolidadoEntry } from "../../../generated/prisma/client";
import type { ManualConsolidadoStatusFilter } from "../manual-consolidado.types";
import { mapStatusFilterToPrisma } from "../manual-consolidado.types";
import { normalizeManualConsolidadoDate } from "../utils/manual-consolidado-date";
import {
  roundCurrency,
  toNumber,
} from "../utils/manual-consolidado-number";

type ListManualConsolidadoDashboardInput = {
  accountIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  status?: ManualConsolidadoStatusFilter;
};

type ManualConsolidadoAccumulator = {
  entries: number;
  outputs: number;
  rescues: number;
  applications: number;
  transferBetweenAccounts: number;
};

type ManualConsolidadoDashboardRow = {
  accountId: string;
  companyName: string;
  referenceDate: string | null;
  initialBalance: number;
  entries: number;
  outputs: number;
  rescues: number;
  applications: number;
  transferBetweenAccounts: number;
  total: number;
};

function getTodayDateKeyInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDateKeyOrUndefined(date?: string) {
  if (!date) {
    return undefined;
  }

  return normalizeManualConsolidadoDate(date).dateKey;
}

function createAccumulator(): ManualConsolidadoAccumulator {
  return {
    entries: 0,
    outputs: 0,
    rescues: 0,
    applications: 0,
    transferBetweenAccounts: 0,
  };
}

function applyEntryImpact(
  accumulator: ManualConsolidadoAccumulator,
  entry: Pick<ManualConsolidadoEntry, "assignment" | "transferDirection" | "amount">,
) {
  const amount = toNumber(entry.amount);

  switch (entry.assignment) {
    case "ENTRADAS":
      accumulator.entries += amount;
      break;
    case "SAIDAS":
      accumulator.outputs += amount;
      break;
    case "RESGATES":
      accumulator.rescues += amount;
      break;
    case "APLICACOES":
      accumulator.applications += amount;
      break;
    case "TRANSFERENCIA_EC":
      accumulator.transferBetweenAccounts +=
        entry.transferDirection === "SAIDA" ? -amount : amount;
      break;
  }
}

function calculateTotal(
  initialBalance: number,
  accumulator: ManualConsolidadoAccumulator,
) {
  return roundCurrency(
    initialBalance +
      accumulator.entries -
      accumulator.outputs +
      accumulator.rescues -
      accumulator.applications +
      accumulator.transferBetweenAccounts,
  );
}

export async function listManualConsolidadoDashboard(
  input: ListManualConsolidadoDashboardInput = {},
) {
  const accountIds = input.accountIds?.filter(Boolean) ?? [];
  const shouldDefaultToToday = !input.dateFrom && !input.dateTo;
  const todayDateKey = shouldDefaultToToday
    ? getTodayDateKeyInSaoPaulo()
    : undefined;
  const dateFromKey = getDateKeyOrUndefined(input.dateFrom) ?? todayDateKey;
  const dateToKey = getDateKeyOrUndefined(input.dateTo) ?? todayDateKey;
  const status = mapStatusFilterToPrisma(input.status);

  const accounts = await prisma.account.findMany({
    where: accountIds.length ? { code: { in: accountIds } } : undefined,
    include: {
      company: true,
      openingBalance: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  const accountInternalIds = accounts.map((account) => account.id);

  const [previousEntries, periodEntries] = await Promise.all([
    dateFromKey
      ? prisma.manualConsolidadoEntry.findMany({
          where: {
            accountId: { in: accountInternalIds },
            dateKey: { lt: dateFromKey },
            ...(status ? { status } : {}),
          },
          select: {
            accountId: true,
            assignment: true,
            transferDirection: true,
            amount: true,
          },
        })
      : Promise.resolve([]),
    prisma.manualConsolidadoEntry.findMany({
      where: {
        accountId: { in: accountInternalIds },
        ...(dateFromKey || dateToKey
          ? {
              dateKey: {
                ...(dateFromKey ? { gte: dateFromKey } : {}),
                ...(dateToKey ? { lte: dateToKey } : {}),
              },
            }
          : {}),
        ...(status ? { status } : {}),
      },
      select: {
        accountId: true,
        assignment: true,
        transferDirection: true,
        amount: true,
      },
    }),
  ]);

  const previousByAccount = new Map<string, ManualConsolidadoAccumulator>();
  const periodByAccount = new Map<string, ManualConsolidadoAccumulator>();

  for (const entry of previousEntries) {
    const accumulator =
      previousByAccount.get(entry.accountId) ?? createAccumulator();
    applyEntryImpact(accumulator, entry);
    previousByAccount.set(entry.accountId, accumulator);
  }

  for (const entry of periodEntries) {
    const accumulator =
      periodByAccount.get(entry.accountId) ?? createAccumulator();
    applyEntryImpact(accumulator, entry);
    periodByAccount.set(entry.accountId, accumulator);
  }

  const rows: ManualConsolidadoDashboardRow[] = accounts.map((account) => {
    const previous = previousByAccount.get(account.id) ?? createAccumulator();
    const period = periodByAccount.get(account.id) ?? createAccumulator();
    const baseInitialBalance = roundCurrency(
      toNumber(account.openingBalance?.initialAvailable ?? 0),
    );
    const initialBalance = calculateTotal(baseInitialBalance, previous);

    return {
      accountId: account.code,
      companyName: account.company.name,
      referenceDate: account.openingBalance?.referenceDate ?? null,
      initialBalance,
      entries: roundCurrency(period.entries),
      outputs: roundCurrency(period.outputs),
      rescues: roundCurrency(period.rescues),
      applications: roundCurrency(period.applications),
      transferBetweenAccounts: roundCurrency(period.transferBetweenAccounts),
      total: calculateTotal(initialBalance, period),
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.initialBalance = roundCurrency(acc.initialBalance + row.initialBalance);
      acc.entries = roundCurrency(acc.entries + row.entries);
      acc.outputs = roundCurrency(acc.outputs + row.outputs);
      acc.rescues = roundCurrency(acc.rescues + row.rescues);
      acc.applications = roundCurrency(acc.applications + row.applications);
      acc.transferBetweenAccounts = roundCurrency(
        acc.transferBetweenAccounts + row.transferBetweenAccounts,
      );
      acc.total = roundCurrency(acc.total + row.total);
      return acc;
    },
    {
      initialBalance: 0,
      entries: 0,
      outputs: 0,
      rescues: 0,
      applications: 0,
      transferBetweenAccounts: 0,
      total: 0,
    },
  );

  return {
    filters: {
      accountIds,
      dateFrom: dateFromKey ?? null,
      dateTo: dateToKey ?? null,
      status: input.status ?? "TODOS",
    },
    rows,
    totals,
  };
}
