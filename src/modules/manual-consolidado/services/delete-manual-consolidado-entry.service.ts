import { prisma } from "../../../lib/prisma";

export async function deleteManualConsolidadoEntry(id: string) {
  if (!id.trim()) {
    throw new Error("O id do lancamento e obrigatorio.");
  }

  const existing = await prisma.manualConsolidadoEntry.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new Error(`Lancamento manual nao encontrado: ${id}`);
  }

  await prisma.manualConsolidadoEntry.delete({
    where: {
      id,
    },
  });

  return {
    deletedCount: 1,
  };
}
