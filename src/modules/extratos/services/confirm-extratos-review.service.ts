import {
  TransactionAssignment,
  TransactionSignal,
} from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

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

    savedCount += 1;
  }

  return {
    savedCount,
  };
}
