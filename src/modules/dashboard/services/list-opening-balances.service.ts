import { prisma } from "../../../lib/prisma";

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

export async function listOpeningBalances() {
  const accounts = await prisma.account.findMany({
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

  return accounts.map((account) => ({
    accountId: account.code,
    bankName: account.bankName,
    companyName: account.company.name,
    groupName: account.company.group.name,
    referenceDate: account.openingBalance?.referenceDate ?? null,
    initialAvailable: toNumber(account.openingBalance?.initialAvailable ?? 0),
    initialApplication: toNumber(
      account.openingBalance?.initialApplication ?? 0,
    ),
  }));
}
