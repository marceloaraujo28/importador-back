import { prisma } from "../../../lib/prisma";
import { TransactionAssignment } from "../../../generated/prisma/client";
import { applyDailySummaryImpact } from "./daily-summary-impact.service";

type AssignmentLabel =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "OUTROS";

type UpdateExtratoInput = {
  id: string;
  assignment: AssignmentLabel;
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

  let updatedCount = 0;

  for (const item of updates) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: item.id },
    });

    if (!transaction) {
      throw new Error(`Extrato não encontrado: ${item.id}`);
    }

    const oldAssignment = mapAssignmentFromPrisma(transaction.assignment);
    const newAssignment = item.assignment;

    if (oldAssignment === newAssignment) {
      continue;
    }

    await applyDailySummaryImpact({
      accountId: transaction.accountId,
      date: transaction.date,
      signal: mapSignalFromPrisma(transaction.signal),
      assignment: oldAssignment,
      amount: Number(transaction.amount),
      direction: -1,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        assignment: mapAssignmentToPrismaEnum(newAssignment),
      },
    });

    await applyDailySummaryImpact({
      accountId: transaction.accountId,
      date: transaction.date,
      signal: mapSignalFromPrisma(transaction.signal),
      assignment: newAssignment,
      amount: Number(transaction.amount),
      direction: 1,
    });

    updatedCount += 1;
  }

  return {
    updatedCount,
  };
}
