import {
  Prisma,
  TransactionAssignment,
} from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

type ListExtratosInput = {
  page: number;
  pageSize: number;
  assignment?:
    | "ENTRADAS"
    | "SAÍDAS"
    | "TARIFAS"
    | "APLICAÇÕES"
    | "RENDIMENTOS"
    | "RENDIMENTO MENSAL"
    | "RESGATES"
    | "TRANSFERÊNCIA EC"
    | "OUTROS";
  dateFrom?: string;
  dateTo?: string;
  dateOrder: "asc" | "desc";
  amount?: number;
  accountIds?: string[];
  bankNames?: string[];
};

function mapAssignmentFromPrisma(
  assignment: TransactionAssignment,
):
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RENDIMENTO MENSAL"
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

function mapAssignmentToPrisma(
  assignment: ListExtratosInput["assignment"],
): TransactionAssignment | undefined {
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
    case "RENDIMENTO MENSAL":
      return "RENDIMENTO_MENSAL";
    case "RESGATES":
      return "RESGATES";
    case "TRANSFERÊNCIA EC":
      return "TRANSFERENCIA_EC";
    case "OUTROS":
      return "OUTROS";
    default:
      return undefined;
  }
}

function mapSignalFromPrisma(signal: "C" | "D"): "C" | "D" {
  return signal === "C" ? "C" : "D";
}

export async function listExtratos(input: ListExtratosInput) {
  const page = Math.max(1, input.page);
  const pageSize = Math.max(1, Math.min(100, input.pageSize));
  const skip = (page - 1) * pageSize;

  const mappedAssignment = mapAssignmentToPrisma(input.assignment);

  const where: Prisma.TransactionWhereInput = {
    ...(mappedAssignment ? { assignment: mappedAssignment } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          dateKey: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {}),
          },
        }
      : {}),
    ...(input.accountIds?.length || input.bankNames?.length
      ? {
          account: {
            ...(input.accountIds?.length
              ? { code: { in: input.accountIds } }
              : {}),
            ...(input.bankNames?.length
              ? { bankName: { in: input.bankNames } }
              : {}),
          },
        }
      : {}),
  };

  const [totalItems, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ dateKey: input.dateOrder }, { createdAt: "desc" }],
      include: {
        account: {
          include: {
            company: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    data: transactions.map((transaction) => ({
      id: transaction.id,
      accountId: transaction.account.code,
      bankName: transaction.account.bankName,
      companyName: transaction.account.company.name,
      date: transaction.date,
      description: transaction.description,
      amount: Number(transaction.amount),
      signal: mapSignalFromPrisma(transaction.signal),
      assignment: mapAssignmentFromPrisma(transaction.assignment),
      ignoreDailySummary: transaction.ignoreDailySummary,
      createdAt: transaction.createdAt.toISOString(),
    })),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
