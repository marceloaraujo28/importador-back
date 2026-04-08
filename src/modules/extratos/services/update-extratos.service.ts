import { prisma } from "../../../lib/prisma";
import { TransactionAssignment } from "../../../generated/prisma/client";
import { applyDailySummaryImpact } from "./daily-summary-impact.service";

type AssignmentLabel =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "OUTROS";

type UpdateExtratoInput = {
  id: string;
  assignment: AssignmentLabel;
  amount?: number;
  ignoreDailySummary?: boolean;
};

type UpdateExtratosInput = {
  updates: UpdateExtratoInput[];
};

function mapAssignmentToPrismaEnum(
  assignment: AssignmentLabel,
): TransactionAssignment {
  switch (assignment) {
    case "ENTRADAS":
      return "ENTRADAS";
    case "SAÍDAS":
      return "SAIDAS";
    case "TARIFAS":
      return "TARIFAS";
    case "APLICAÇÕES":
      return "APLICACOES";
    case "RENDIMENTOS":
      return "RENDIMENTOS";
    case "RESGATES":
      return "RESGATES";
    case "TRANSFERÊNCIA EC":
      return "TRANSFERENCIA_EC";
    default:
      return "OUTROS";
  }
}

function mapAssignmentFromPrisma(
  assignment: string,
):
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "OUTROS" {
  switch (assignment) {
    case "ENTRADAS":
      return "ENTRADAS";
    case "SAIDAS":
      return "SAÍDAS";
    case "TARIFAS":
      return "TARIFAS";
    case "APLICACOES":
      return "APLICAÇÕES";
    case "RENDIMENTOS":
      return "RENDIMENTOS";
    case "RESGATES":
      return "RESGATES";
    case "TRANSFERENCIA_EC":
      return "TRANSFERÊNCIA EC";
    default:
      return "OUTROS";
  }
}

function mapSignalFromPrisma(signal: string): "C" | "D" {
  return signal === "C" ? "C" : "D";
}

export async function updateExtratos(input: UpdateExtratosInput) {
  const updates = input.updates ?? [];

  if (!updates.length) {
    throw new Error("Nenhuma atualização enviada.");
  }

  const updatedCount = await prisma.$transaction(async (tx) => {
    let count = 0;

    for (const item of updates) {
      const transaction = await tx.transaction.findUnique({
        where: { id: item.id },
      });

      if (!transaction) {
        throw new Error(`Extrato não encontrado: ${item.id}`);
      }

      const oldAssignment = mapAssignmentFromPrisma(transaction.assignment);
      const newAssignment = item.assignment;
      const oldAmount = Number(transaction.amount);
      const newAmount = item.amount ?? oldAmount;
      const oldIgnoreDailySummary = transaction.ignoreDailySummary;
      const newIgnoreDailySummary =
        item.ignoreDailySummary ?? oldIgnoreDailySummary;

      if (!Number.isFinite(newAmount) || newAmount < 0) {
        throw new Error(`Valor inválido para o extrato ${item.id}.`);
      }

      const hasAssignmentChanged = oldAssignment !== newAssignment;
      const hasAmountChanged = oldAmount !== newAmount;
      const hasIgnoreDailySummaryChanged =
        oldIgnoreDailySummary !== newIgnoreDailySummary;

      if (
        !hasAssignmentChanged &&
        !hasAmountChanged &&
        !hasIgnoreDailySummaryChanged
      ) {
        continue;
      }

      if (!oldIgnoreDailySummary) {
        await applyDailySummaryImpact({
          client: tx,
          accountId: transaction.accountId,
          date: transaction.date,
          signal: mapSignalFromPrisma(transaction.signal),
          assignment: oldAssignment,
          amount: oldAmount,
          direction: -1,
        });
      }

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          assignment: mapAssignmentToPrismaEnum(newAssignment),
          amount: newAmount,
          ignoreDailySummary: newIgnoreDailySummary,
        },
      });

      if (!newIgnoreDailySummary) {
        await applyDailySummaryImpact({
          client: tx,
          accountId: transaction.accountId,
          date: transaction.date,
          signal: mapSignalFromPrisma(transaction.signal),
          assignment: newAssignment,
          amount: newAmount,
          direction: 1,
        });
      }

      count += 1;
    }

    return count;
  });

  return {
    updatedCount,
  };
}
