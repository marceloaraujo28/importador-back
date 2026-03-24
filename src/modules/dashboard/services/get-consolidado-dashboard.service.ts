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
  rescues: number;
  applications: number;
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
      dailySummaries: {
        where: {
          ...(filters.dateFrom ? { dateKey: { gte: filters.dateFrom } } : {}),
          ...(filters.dateTo
            ? {
                ...(filters.dateFrom
                  ? { dateKey: { gte: filters.dateFrom, lte: filters.dateTo } }
                  : { dateKey: { lte: filters.dateTo } }),
              }
            : {}),
        },
      },
    },
    orderBy: {
      code: "asc",
    },
  });

  const accountSummaries: AccountCalculatedSummary[] = accounts.map(
    (account) => {
      const initialAvailable = toNumber(
        account.openingBalance?.initialAvailable ?? 0,
      );
      const initialApplication = toNumber(
        account.openingBalance?.initialApplication ?? 0,
      );

      const entries = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.entries),
        0,
      );
      const outputs = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.outputs),
        0,
      );
      const fees = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.fees),
        0,
      );
      const yields = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.yields),
        0,
      );
      const rescues = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.rescues),
        0,
      );
      const applications = account.dailySummaries.reduce(
        (sum, item) => sum + toNumber(item.applications),
        0,
      );

      const available = roundCurrency(
        initialAvailable +
          entries +
          yields +
          rescues -
          fees -
          outputs -
          applications,
      );

      const rawApplication = roundCurrency(
        initialApplication + applications - rescues,
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
        rescues: roundCurrency(rescues),
        applications: roundCurrency(applications),
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
