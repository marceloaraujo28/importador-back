import {
  TransactionAssignment,
  TransactionSignal,
} from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { parsePtBrDateToDateKey } from "../../dashboard/utils/dashboard-date";

type ReviewTransactionInput = {
  accountId: string;
  bankName: string;
  companyName: string;
  date: string;
  description: string;
  amount: number;
  signal: "C" | "D";
  assignment:
    | "ENTRADAS"
    | "SAÍDAS"
    | "TARIFAS"
    | "APLICAÇÕES"
    | "RESGATES"
    | "IGNORAR"
    | "OUTROS";
};

type ConfirmExtratosReviewInput = {
  transactions: ReviewTransactionInput[];
};

function mapAssignmentToPrismaEnum(
  assignment: ReviewTransactionInput["assignment"],
): TransactionAssignment {
  switch (assignment) {
    case "ENTRADAS":
      return TransactionAssignment.ENTRADAS;
    case "SAÍDAS":
      return TransactionAssignment.SAIDAS;
    case "TARIFAS":
      return TransactionAssignment.TARIFAS;
    case "APLICAÇÕES":
      return TransactionAssignment.APLICACOES;
    case "RESGATES":
      return TransactionAssignment.RESGATES;
    case "OUTROS":
      return TransactionAssignment.OUTROS;
    case "IGNORAR":
      return TransactionAssignment.OUTROS;
    default:
      return TransactionAssignment.OUTROS;
  }
}

function mapSignalToPrismaEnum(signal: "C" | "D"): TransactionSignal {
  return signal === "C" ? TransactionSignal.C : TransactionSignal.D;
}

async function incrementDailySummary(params: {
  accountId: string;
  date: string;
  assignment: ReviewTransactionInput["assignment"];
  amount: number;
}) {
  const dateKey = parsePtBrDateToDateKey(params.date);

  const updateData: {
    entries?: { increment: number };
    outputs?: { increment: number };
    fees?: { increment: number };
    yields?: { increment: number };
    rescues?: { increment: number };
    applications?: { increment: number };
  } = {};

  switch (params.assignment) {
    case "ENTRADAS":
      updateData.entries = { increment: params.amount };
      break;
    case "SAÍDAS":
      updateData.outputs = { increment: params.amount };
      break;
    case "TARIFAS":
      updateData.fees = { increment: params.amount };
      break;
    case "APLICAÇÕES":
      updateData.applications = { increment: params.amount };
      break;
    case "RESGATES":
      updateData.rescues = { increment: params.amount };
      break;
    default:
      break;
  }

  await prisma.accountDailySummary.upsert({
    where: {
      accountId_dateKey: {
        accountId: params.accountId,
        dateKey,
      },
    },
    update: updateData,
    create: {
      accountId: params.accountId,
      dateKey,
      entries: updateData.entries?.increment ?? 0,
      outputs: updateData.outputs?.increment ?? 0,
      fees: updateData.fees?.increment ?? 0,
      yields: updateData.yields?.increment ?? 0,
      rescues: updateData.rescues?.increment ?? 0,
      applications: updateData.applications?.increment ?? 0,
    },
  });
}

export async function confirmExtratosReview(input: ConfirmExtratosReviewInput) {
  const transactions = input.transactions ?? [];

  if (!transactions.length) {
    throw new Error("Nenhuma transação enviada para salvar.");
  }

  let savedCount = 0;

  for (const transaction of transactions) {
    const account = await prisma.account.findUnique({
      where: {
        code: transaction.accountId,
      },
    });

    if (!account) {
      throw new Error(
        `Conta não encontrada para o identificador ${transaction.accountId}.`,
      );
    }

    await prisma.transaction.create({
      data: {
        accountId: account.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        signal: mapSignalToPrismaEnum(transaction.signal),
        assignment: mapAssignmentToPrismaEnum(transaction.assignment),
      },
    });

    await incrementDailySummary({
      accountId: account.id,
      date: transaction.date,
      assignment: transaction.assignment,
      amount: transaction.amount,
    });

    savedCount += 1;
  }

  return {
    savedCount,
  };
}
