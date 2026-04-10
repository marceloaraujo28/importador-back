import {
  TransactionAssignment,
  TransactionSignal,
} from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { parsePtBrDateToDateKey } from "../../dashboard/utils/dashboard-date";
import { applyDailySummaryImpact } from "./daily-summary-impact.service";

export type SaveExtratoInput = {
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
    | "RENDIMENTOS"
    | "RENDIMENTO MENSAL"
    | "RESGATES"
    | "TRANSFERÊNCIA EC"
    | "IGNORAR"
    | "OUTROS";
  ignoreDailySummary?: boolean;
};

export type SaveExtratosInput = {
  transactions: SaveExtratoInput[];
};

function mapAssignmentToPrismaEnum(
  assignment: SaveExtratoInput["assignment"],
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
    case "RENDIMENTOS":
      return TransactionAssignment.RENDIMENTOS;
    case "RESGATES":
      return TransactionAssignment.RESGATES;
    case "RENDIMENTO MENSAL":
      return TransactionAssignment.RENDIMENTO_MENSAL;
    case "TRANSFERÊNCIA EC":
      return TransactionAssignment.TRANSFERENCIA_EC;
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

export async function saveExtratos(input: SaveExtratosInput) {
  const transactions = input.transactions ?? [];

  if (!transactions.length) {
    throw new Error("Nenhuma transação enviada para salvar.");
  }

  const savedCount = await prisma.$transaction(async (tx) => {
    let count = 0;
    const accountIdByCode = new Map<string, string>();

    for (const transaction of transactions) {
      let internalAccountId = accountIdByCode.get(transaction.accountId);

      if (!internalAccountId) {
        const account = await tx.account.findUnique({
          where: {
            code: transaction.accountId,
          },
        });

        if (!account) {
          throw new Error(
            `Conta não encontrada para o identificador ${transaction.accountId}.`,
          );
        }

        internalAccountId = account.id;
        accountIdByCode.set(transaction.accountId, account.id);
      }

      const ignoreDailySummary = transaction.ignoreDailySummary ?? false;

      await tx.transaction.create({
        data: {
          accountId: internalAccountId,
          date: transaction.date,
          dateKey: parsePtBrDateToDateKey(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          signal: mapSignalToPrismaEnum(transaction.signal),
          assignment: mapAssignmentToPrismaEnum(transaction.assignment),
          ignoreDailySummary,
        },
      });

      if (!ignoreDailySummary) {
        await applyDailySummaryImpact({
          client: tx,
          accountId: internalAccountId,
          date: transaction.date,
          signal: transaction.signal,
          assignment: transaction.assignment,
          amount: transaction.amount,
          direction: 1,
        });
      }

      count += 1;
    }

    return count;
  });

  return {
    savedCount,
  };
}
