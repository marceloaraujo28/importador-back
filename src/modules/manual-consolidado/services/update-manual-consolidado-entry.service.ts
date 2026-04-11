import { prisma } from "../../../lib/prisma";
import type {
  ManualConsolidadoAssignmentLabel,
  ManualConsolidadoStatusLabel,
  ManualConsolidadoTransferDirectionLabel,
} from "../manual-consolidado.types";
import {
  mapAssignmentToPrisma,
  mapStatusToPrisma,
  mapTransferDirectionToPrisma,
} from "../manual-consolidado.types";
import { normalizeManualConsolidadoDate } from "../utils/manual-consolidado-date";
import { mapManualConsolidadoEntryResponse } from "../utils/manual-consolidado-response";

export type UpdateManualConsolidadoEntryInput = {
  id: string;
  accountId?: string;
  date?: string;
  amount?: number;
  description?: string;
  assignment?: ManualConsolidadoAssignmentLabel;
  transferDirection?: ManualConsolidadoTransferDirectionLabel | null;
  status?: ManualConsolidadoStatusLabel;
};

export async function updateManualConsolidadoEntry(
  input: UpdateManualConsolidadoEntryInput,
) {
  if (!input.id.trim()) {
    throw new Error("O id do lancamento e obrigatorio.");
  }

  const existing = await prisma.manualConsolidadoEntry.findUnique({
    where: {
      id: input.id,
    },
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error(`Lancamento manual nao encontrado: ${input.id}`);
  }

  const nextAssignment = input.assignment ?? existing.assignment;
  const nextTransferDirection =
    nextAssignment === "TRANSFERENCIA_EC"
      ? input.transferDirection ?? existing.transferDirection
      : null;

  if (
    nextAssignment === "TRANSFERENCIA_EC" &&
    !nextTransferDirection
  ) {
    throw new Error(
      "A direcao da transferencia entre contas e obrigatoria.",
    );
  }

  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount <= 0)) {
    throw new Error("O valor deve ser maior que zero.");
  }

  if (input.description !== undefined && !input.description.trim()) {
    throw new Error("A descricao e obrigatoria.");
  }

  let nextInternalAccountId = existing.accountId;

  if (input.accountId !== undefined) {
    if (!input.accountId.trim()) {
      throw new Error("O id da conta e obrigatorio.");
    }

    const nextAccount = await prisma.account.findUnique({
      where: {
        code: input.accountId,
      },
    });

    if (!nextAccount) {
      throw new Error(
        `Conta nao encontrada para o identificador ${input.accountId}.`,
      );
    }

    nextInternalAccountId = nextAccount.id;
  }

  const normalizedDate = input.date
    ? normalizeManualConsolidadoDate(input.date)
    : null;

  const updated = await prisma.manualConsolidadoEntry.update({
    where: {
      id: input.id,
    },
    data: {
      accountId: nextInternalAccountId,
      ...(normalizedDate
        ? {
            date: normalizedDate.date,
            dateKey: normalizedDate.dateKey,
          }
        : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      assignment: mapAssignmentToPrisma(
        nextAssignment as ManualConsolidadoAssignmentLabel,
      ),
      transferDirection: mapTransferDirectionToPrisma(
        nextTransferDirection,
      ),
      ...(input.status !== undefined
        ? {
            status: mapStatusToPrisma(input.status),
          }
        : {}),
    },
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  return mapManualConsolidadoEntryResponse(updated);
}
