import { prisma } from "../../../lib/prisma";
import { isSucataAccount } from "../config/sucata-accounts";

type GetConsolidadoDashboardInput = {
  dateFrom?: string;
  dateTo?: string;
  companyName?: string;
  groupName?: string;
};

type AccountCalculatedSummary = {
  accountId: string;
  bankName: string;
  companyName: string;
  groupName: string;
  referenceDate: string | null;
  initialAvailable: number;
  initialApplication: number;
  entries: number;
  outputs: number;
  fees: number;
  yields: number;
  monthlyYields: number;
  rescues: number;
  applications: number;
  transferEcIn: number;
  transferEcOut: number;
  transferEcNet: number;
  available: number;
  application: number;
  sucata: number;
  total: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return Number(value.toString());
  }

  return Number(value ?? 0);
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function applyAvailableImpact(
  initialAvailable: number,
  summaries: Array<{
    entries: unknown;
    outputs: unknown;
    fees: unknown;
    yields: unknown;
    rescues: unknown;
    applications: unknown;
    transferEcIn: unknown;
    transferEcOut: unknown;
  }>,
) {
  return roundCurrency(
    initialAvailable +
      summaries.reduce((sum, item) => sum + toNumber(item.entries), 0) +
      summaries.reduce((sum, item) => sum + toNumber(item.yields), 0) +
      summaries.reduce((sum, item) => sum + toNumber(item.rescues), 0) +
      summaries.reduce((sum, item) => sum + toNumber(item.transferEcIn), 0) -
      summaries.reduce((sum, item) => sum + toNumber(item.fees), 0) -
      summaries.reduce((sum, item) => sum + toNumber(item.outputs), 0) -
      summaries.reduce((sum, item) => sum + toNumber(item.applications), 0) -
      summaries.reduce((sum, item) => sum + toNumber(item.transferEcOut), 0),
  );
}

function applyApplicationImpact(
  initialApplication: number,
  summaries: Array<{
    monthlyYields: unknown;
    rescues: unknown;
    applications: unknown;
  }>,
) {
  return roundCurrency(
    initialApplication +
      summaries.reduce((sum, item) => sum + toNumber(item.applications), 0) +
      summaries.reduce((sum, item) => sum + toNumber(item.monthlyYields), 0) -
      summaries.reduce((sum, item) => sum + toNumber(item.rescues), 0),
  );
}

export async function getConsolidadoDashboard(
  filters: GetConsolidadoDashboardInput = {},
) {
  const accounts = await prisma.account.findMany({
    where: {
      ...(filters.companyName
        ? {
            company: {
              name: filters.companyName,
            },
          }
        : {}),
      ...(filters.groupName
        ? {
            company: {
              ...(filters.companyName ? { name: filters.companyName } : {}),
              group: {
                name: filters.groupName,
              },
            },
          }
        : {}),
    },
    include: {
      company: {
        include: {
          group: true,
        },
      },
      openingBalance: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const [previousDailySummaries, periodDailySummaries] = await Promise.all([
    filters.dateFrom
      ? prisma.accountDailySummary.findMany({
          where: {
            accountId: { in: accountIds },
            dateKey: { lt: filters.dateFrom },
          },
        })
      : Promise.resolve([]),
    prisma.accountDailySummary.findMany({
      where: {
        accountId: { in: accountIds },
        ...(filters.dateFrom || filters.dateTo
          ? {
              dateKey: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
              },
            }
          : {}),
      },
    }),
  ]);

  const previousDailySummariesByAccount = new Map<
    string,
    typeof previousDailySummaries
  >();
  const periodDailySummariesByAccount = new Map<
    string,
    typeof periodDailySummaries
  >();

  for (const summary of previousDailySummaries) {
    const summaries =
      previousDailySummariesByAccount.get(summary.accountId) ?? [];
    summaries.push(summary);
    previousDailySummariesByAccount.set(summary.accountId, summaries);
  }

  for (const summary of periodDailySummaries) {
    const summaries = periodDailySummariesByAccount.get(summary.accountId) ?? [];
    summaries.push(summary);
    periodDailySummariesByAccount.set(summary.accountId, summaries);
  }

  const accountSummaries: AccountCalculatedSummary[] = accounts.map(
    (account) => {
      const baseInitialAvailable = toNumber(
        account.openingBalance?.initialAvailable ?? 0,
      );
      const baseInitialApplication = toNumber(
        account.openingBalance?.initialApplication ?? 0,
      );
      const previousSummaries =
        previousDailySummariesByAccount.get(account.id) ?? [];
      const currentPeriodSummaries =
        periodDailySummariesByAccount.get(account.id) ?? [];

      const initialAvailable = applyAvailableImpact(
        baseInitialAvailable,
        previousSummaries,
      );
      const initialApplication = applyApplicationImpact(
        baseInitialApplication,
        previousSummaries,
      );

      const entries = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.entries),
        0,
      );
      const outputs = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.outputs),
        0,
      );
      const fees = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.fees),
        0,
      );
      const yields = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.yields),
        0,
      );
      const monthlyYields = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.monthlyYields),
        0,
      );
      const rescues = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.rescues),
        0,
      );
      const applications = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.applications),
        0,
      );
      const transferEcIn = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.transferEcIn),
        0,
      );
      const transferEcOut = currentPeriodSummaries.reduce(
        (sum, item) => sum + toNumber(item.transferEcOut),
        0,
      );

      const transferEcNet = roundCurrency(transferEcIn - transferEcOut);

      const available = roundCurrency(
        initialAvailable +
          entries +
          yields +
          rescues +
          transferEcIn -
          fees -
          outputs -
          applications -
          transferEcOut,
      );

      const rawApplication = roundCurrency(
        initialApplication + applications + monthlyYields - rescues,
      );

      const sucata = isSucataAccount(account.code) ? rawApplication : 0;
      const application = isSucataAccount(account.code) ? 0 : rawApplication;
      const total = roundCurrency(available + application + sucata);

      return {
        accountId: account.code,
        bankName: account.bankName,
        companyName: account.company.name,
        groupName: account.company.group.name,
        referenceDate: account.openingBalance?.referenceDate ?? null,
        initialAvailable: roundCurrency(initialAvailable),
        initialApplication: roundCurrency(initialApplication),
        entries: roundCurrency(entries),
        outputs: roundCurrency(outputs),
        fees: roundCurrency(fees),
        yields: roundCurrency(yields),
        monthlyYields: roundCurrency(monthlyYields),
        rescues: roundCurrency(rescues),
        applications: roundCurrency(applications),
        transferEcIn: roundCurrency(transferEcIn),
        transferEcOut: roundCurrency(transferEcOut),
        transferEcNet,
        available,
        application,
        sucata,
        total,
      };
    },
  );

  const companyMap = new Map<
    string,
    {
      name: string;
      groupName: string;
      available: number;
      sucata: number;
      application: number;
      total: number;
    }
  >();

  for (const account of accountSummaries) {
    const existing = companyMap.get(account.companyName);

    if (existing) {
      existing.available = roundCurrency(
        existing.available + account.available,
      );
      existing.sucata = roundCurrency(existing.sucata + account.sucata);
      existing.application = roundCurrency(
        existing.application + account.application,
      );
      existing.total = roundCurrency(existing.total + account.total);
    } else {
      companyMap.set(account.companyName, {
        name: account.companyName,
        groupName: account.groupName,
        available: account.available,
        sucata: account.sucata,
        application: account.application,
        total: account.total,
      });
    }
  }

  const companies = Array.from(companyMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  const groupMap = new Map<
    string,
    {
      name: string;
      available: number;
      sucata: number;
      application: number;
      total: number;
    }
  >();

  for (const company of companies) {
    const existing = groupMap.get(company.groupName);

    if (existing) {
      existing.available = roundCurrency(
        existing.available + company.available,
      );
      existing.sucata = roundCurrency(existing.sucata + company.sucata);
      existing.application = roundCurrency(
        existing.application + company.application,
      );
      existing.total = roundCurrency(existing.total + company.total);
    } else {
      groupMap.set(company.groupName, {
        name: company.groupName,
        available: company.available,
        sucata: company.sucata,
        application: company.application,
        total: company.total,
      });
    }
  }

  const groups = Array.from(groupMap.values()).sort(
    (a, b) => b.total - a.total,
  );

  const summary = groups.reduce(
    (acc, group) => {
      acc.available = roundCurrency(acc.available + group.available);
      acc.sucata = roundCurrency(acc.sucata + group.sucata);
      acc.application = roundCurrency(acc.application + group.application);
      acc.total = roundCurrency(acc.total + group.total);
      return acc;
    },
    {
      available: 0,
      sucata: 0,
      application: 0,
      total: 0,
    },
  );

  const totalForPercent = summary.total || 1;

  return {
    filters: {
      dateFrom: filters.dateFrom ?? null,
      dateTo: filters.dateTo ?? null,
      companyName: filters.companyName ?? null,
      groupName: filters.groupName ?? null,
    },
    summary: {
      ...summary,
      availablePercent: roundCurrency(
        (summary.available / totalForPercent) * 100,
      ),
      sucataPercent: roundCurrency((summary.sucata / totalForPercent) * 100),
      applicationPercent: roundCurrency(
        (summary.application / totalForPercent) * 100,
      ),
      companiesCount: companies.length,
      groupsCount: groups.length,
    },
    groups,
    companies,
    accounts: accountSummaries,
  };
}
