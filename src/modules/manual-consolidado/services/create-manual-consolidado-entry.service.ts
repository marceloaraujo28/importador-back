import { prisma } from "../../../lib/prisma";
import type {
  ManualConsolidadoAssignmentLabel,
  ManualConsolidadoTransferDirectionLabel,
} from "../manual-consolidado.types";
import {
  mapAssignmentToPrisma,
  mapTransferDirectionToPrisma,
} from "../manual-consolidado.types";
import { normalizeManualConsolidadoDate } from "../utils/manual-consolidado-date";
import { mapManualConsolidadoEntryResponse } from "../utils/manual-consolidado-response";

export type CreateManualConsolidadoEntryInput = {
  accountId: string;
  date: string;
  amount: number;
  description: string;
  assignment: ManualConsolidadoAssignmentLabel;
  transferDirection?: ManualConsolidadoTransferDirectionLabel | null;
};

function validateManualConsolidadoPayload(
  input: Pick<
    CreateManualConsolidadoEntryInput,
    "amount" | "assignment" | "description" | "transferDirection"
  >,
) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("O valor deve ser maior que zero.");
  }

  if (!input.description.trim()) {
    throw new Error("A descricao e obrigatoria.");
  }

  if (
    input.assignment === "TRANSFERENCIA_EC" &&
    !input.transferDirection
  ) {
    throw new Error(
      "A direcao da transferencia entre contas e obrigatoria.",
    );
  }
}

export async function createManualConsolidadoEntry(
  input: CreateManualConsolidadoEntryInput,
) {
  if (!input.accountId.trim()) {
    throw new Error("O id da conta e obrigatorio.");
  }

  validateManualConsolidadoPayload(input);

  const normalizedDate = normalizeManualConsolidadoDate(input.date);
  const account = await prisma.account.findUnique({
    where: {
      code: input.accountId,
    },
  });

  if (!account) {
    throw new Error(`Conta nao encontrada para o identificador ${input.accountId}.`);
  }

  const entry = await prisma.manualConsolidadoEntry.create({
    data: {
      accountId: account.id,
      date: normalizedDate.date,
      dateKey: normalizedDate.dateKey,
      amount: input.amount,
      description: input.description.trim(),
      assignment: mapAssignmentToPrisma(input.assignment),
      transferDirection:
        input.assignment === "TRANSFERENCIA_EC"
          ? mapTransferDirectionToPrisma(input.transferDirection)
          : null,
    },
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  return mapManualConsolidadoEntryResponse(entry);
}
