import { prisma } from "../../../lib/prisma";

type UpdateOpeningBalanceInput = {
  accountCode: string;
  referenceDate: string | null;
  initialAvailable: number;
  initialApplication: number;
};

export async function updateOpeningBalance(input: UpdateOpeningBalanceInput) {
  const account = await prisma.account.findUnique({
    where: {
      code: input.accountCode,
    },
    include: {
      openingBalance: true,
    },
  });

  if (!account) {
    throw new Error(`Conta não encontrada: ${input.accountCode}`);
  }

  const result = await prisma.accountOpeningBalance.upsert({
    where: {
      accountId: account.id,
    },
    update: {
      referenceDate: input.referenceDate,
      initialAvailable: input.initialAvailable,
      initialApplication: input.initialApplication,
    },
    create: {
      accountId: account.id,
      referenceDate: input.referenceDate,
      initialAvailable: input.initialAvailable,
      initialApplication: input.initialApplication,
    },
  });

  return {
    accountId: account.code,
    referenceDate: result.referenceDate,
    initialAvailable: Number(result.initialAvailable),
    initialApplication: Number(result.initialApplication),
  };
}
