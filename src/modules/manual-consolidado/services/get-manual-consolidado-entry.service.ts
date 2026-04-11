import { prisma } from "../../../lib/prisma";
import { mapManualConsolidadoEntryResponse } from "../utils/manual-consolidado-response";

export async function getManualConsolidadoEntry(id: string) {
  if (!id.trim()) {
    throw new Error("O id do lancamento e obrigatorio.");
  }

  const entry = await prisma.manualConsolidadoEntry.findUnique({
    where: {
      id,
    },
    include: {
      account: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error(`Lancamento manual nao encontrado: ${id}`);
  }

  return mapManualConsolidadoEntryResponse(entry);
}
