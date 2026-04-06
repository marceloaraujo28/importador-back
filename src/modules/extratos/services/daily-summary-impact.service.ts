import { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { parsePtBrDateToDateKey } from "../../dashboard/utils/dashboard-date";

type SummaryClient = PrismaClient | Prisma.TransactionClient;

type AssignmentLabel =
  | "ENTRADAS"
  | "SAÍDAS"
  | "TARIFAS"
  | "APLICAÇÕES"
  | "RENDIMENTOS"
  | "RESGATES"
  | "TRANSFERÊNCIA EC"
  | "IGNORAR"
  | "OUTROS";

type ApplyDailySummaryImpactInput = {
  client?: SummaryClient;
  accountId: string;
  date: string;
  signal: "C" | "D";
  assignment: AssignmentLabel;
  amount: number;
  direction: 1 | -1;
};

export async function applyDailySummaryImpact(
  input: ApplyDailySummaryImpactInput,
) {
  const client = input.client ?? prisma;
  const dateKey = parsePtBrDateToDateKey(input.date);

  const updateData: {
    entries?: { increment: number };
    outputs?: { increment: number };
    fees?: { increment: number };
    yields?: { increment: number };
    rescues?: { increment: number };
    applications?: { increment: number };
    transferEcIn?: { increment: number };
    transferEcOut?: { increment: number };
  } = {};

  const value = input.amount * input.direction;

  switch (input.assignment) {
    case "ENTRADAS":
      updateData.entries = { increment: value };
      break;
    case "SAÍDAS":
      updateData.outputs = { increment: value };
      break;
    case "TARIFAS":
      updateData.fees = { increment: value };
      break;
    case "APLICAÇÕES":
      updateData.applications = { increment: value };
      break;
    case "RENDIMENTOS":
      updateData.yields = { increment: value };
      break;
    case "RESGATES":
      updateData.rescues = { increment: value };
      break;
    case "TRANSFERÊNCIA EC":
      if (input.signal === "C") {
        updateData.transferEcIn = { increment: value };
      } else {
        updateData.transferEcOut = { increment: value };
      }
      break;
    default:
      break;
  }

  await client.accountDailySummary.upsert({
    where: {
      accountId_dateKey: {
        accountId: input.accountId,
        dateKey,
      },
    },
    update: updateData,
    create: {
      accountId: input.accountId,
      dateKey,
      entries: updateData.entries?.increment ?? 0,
      outputs: updateData.outputs?.increment ?? 0,
      fees: updateData.fees?.increment ?? 0,
      yields: updateData.yields?.increment ?? 0,
      rescues: updateData.rescues?.increment ?? 0,
      applications: updateData.applications?.increment ?? 0,
      transferEcIn: updateData.transferEcIn?.increment ?? 0,
      transferEcOut: updateData.transferEcOut?.increment ?? 0,
    },
  });
}
