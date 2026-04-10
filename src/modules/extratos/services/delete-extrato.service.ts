import { prisma } from "../../../lib/prisma";
import { applyDailySummaryImpact } from "./daily-summary-impact.service";

type AssignmentLabel =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RENDIMENTO MENSAL"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "OUTROS";

function mapAssignmentFromPrisma(
  assignment: string,
): AssignmentLabel {
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
    case "RENDIMENTO_MENSAL":
      return "RENDIMENTO MENSAL";
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

export async function deleteExtrato(id: string) {
  if (!id) {
    throw new Error("O id do extrato é obrigatório.");
  }

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new Error(`Extrato não encontrado: ${id}`);
    }

    if (!transaction.ignoreDailySummary) {
      await applyDailySummaryImpact({
        client: tx,
        accountId: transaction.accountId,
        date: transaction.date,
        signal: mapSignalFromPrisma(transaction.signal),
        assignment: mapAssignmentFromPrisma(transaction.assignment),
        amount: Number(transaction.amount),
        direction: -1,
      });
    }

    await tx.transaction.delete({
      where: { id: transaction.id },
    });
  });

  return {
    deletedCount: 1,
  };
}
