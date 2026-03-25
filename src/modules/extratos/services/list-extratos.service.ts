import { prisma } from "../../../lib/prisma";

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

export async function listExtratos() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    accountId: transaction.account.code,
    bankName: transaction.account.bankName,
    companyName: transaction.account.company.name,
    date: transaction.date,
    description: transaction.description,
    amount: Number(transaction.amount),
    signal: mapSignalFromPrisma(transaction.signal),
    assignment: mapAssignmentFromPrisma(transaction.assignment),
    createdAt: transaction.createdAt.toISOString(),
  }));
}
