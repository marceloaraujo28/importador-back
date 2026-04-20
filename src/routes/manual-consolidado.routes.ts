import type { FastifyInstance } from "fastify";
import { createManualConsolidadoEntry } from "../modules/manual-consolidado/services/create-manual-consolidado-entry.service";
import { deleteManualConsolidadoEntry } from "../modules/manual-consolidado/services/delete-manual-consolidado-entry.service";
import { getManualConsolidadoEntry } from "../modules/manual-consolidado/services/get-manual-consolidado-entry.service";
import { listManualConsolidadoDashboard } from "../modules/manual-consolidado/services/list-manual-consolidado-dashboard.service";
import { listManualConsolidadoEntries } from "../modules/manual-consolidado/services/list-manual-consolidado-entries.service";
import { updateManualConsolidadoEntry } from "../modules/manual-consolidado/services/update-manual-consolidado-entry.service";
import {
  isManualConsolidadoAssignment,
  isManualConsolidadoStatus,
  isManualConsolidadoStatusFilter,
  isManualConsolidadoTransferDirection,
  type ManualConsolidadoAssignmentLabel,
  type ManualConsolidadoStatusFilter,
  type ManualConsolidadoStatusLabel,
  type ManualConsolidadoTransferDirectionLabel,
} from "../modules/manual-consolidado/manual-consolidado.types";

function toStringArray(value?: string | string[]) {
  const list = Array.isArray(value) ? value : value ? [value] : [];

  return list
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function manualConsolidadoRoutes(app: FastifyInstance) {
  app.get("/consolidado-manual/resumo", async (request, reply) => {
    try {
      const query = request.query as {
        accountId?: string | string[];
        dateFrom?: string;
        dateTo?: string;
        status?: string;
      };

      if (query.status && !isManualConsolidadoStatusFilter(query.status)) {
        return reply.status(400).send({
          error: `Status invalido recebido: ${query.status}.`,
        });
      }

      const result = await listManualConsolidadoDashboard({
        accountIds: toStringArray(query.accountId),
        ...(query.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query.dateTo ? { dateTo: query.dateTo } : {}),
        ...(query.status
          ? {
              status:
                query.status as ManualConsolidadoStatusFilter,
            }
          : {}),
      });

      return reply.send({
        message: "Resumo do consolidado manual carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar resumo do consolidado manual.",
      });
    }
  });

  app.get("/consolidado-manual/lancamentos", async (request, reply) => {
    try {
      const query = request.query as {
        page?: string;
        pageSize?: string;
        accountId?: string | string[];
        dateFrom?: string;
        dateTo?: string;
        dateOrder?: "asc" | "desc";
        amount?: string;
        description?: string;
        assignment?: string | string[];
        status?: string;
      };

      const assignments = toStringArray(query.assignment);

      if (assignments.some((assignment) => !isManualConsolidadoAssignment(assignment))) {
        return reply.status(400).send({
          error: "Uma ou mais classificacoes recebidas sao invalidas.",
        });
      }

      if (query.status && !isManualConsolidadoStatusFilter(query.status)) {
        return reply.status(400).send({
          error: `Status invalido recebido: ${query.status}.`,
        });
      }

      const result = await listManualConsolidadoEntries({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 20),
        dateOrder: query.dateOrder === "asc" ? "asc" : "desc",
        accountIds: toStringArray(query.accountId),
        ...(query.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query.dateTo ? { dateTo: query.dateTo } : {}),
        ...(query.amount !== undefined ? { amount: Number(query.amount) } : {}),
        ...(query.description ? { description: query.description } : {}),
        ...(assignments.length
          ? {
              assignment:
                assignments as ManualConsolidadoAssignmentLabel[],
            }
          : {}),
        ...(query.status
          ? {
              status:
                query.status as ManualConsolidadoStatusFilter,
            }
          : {}),
      });

      return reply.send({
        message: "Lancamentos do consolidado manual carregados com sucesso.",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar lancamentos do consolidado manual.",
      });
    }
  });

  app.get("/consolidado-manual/lancamentos/:id", async (request, reply) => {
    try {
      const params = request.params as {
        id: string;
      };

      const result = await getManualConsolidadoEntry(params.id);

      return reply.send({
        message: "Lancamento manual carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar lancamento manual.",
      });
    }
  });

  app.post("/consolidado-manual/lancamentos", async (request, reply) => {
    try {
      const body = request.body as {
        accountId?: string;
        date?: string;
        amount?: number;
        description?: string;
        assignment?: string;
        transferDirection?: string | null;
      };

      if (!body.accountId || !body.date || !body.description) {
        return reply.status(400).send({
          error: "Os campos accountId, date e description sao obrigatorios.",
        });
      }

      if (!body.assignment || !isManualConsolidadoAssignment(body.assignment)) {
        return reply.status(400).send({
          error: "A classificacao enviada e invalida.",
        });
      }

      if (
        body.transferDirection &&
        !isManualConsolidadoTransferDirection(body.transferDirection)
      ) {
        return reply.status(400).send({
          error: "A direcao da transferencia enviada e invalida.",
        });
      }

      const result = await createManualConsolidadoEntry({
        accountId: body.accountId,
        date: body.date,
        amount: Number(body.amount ?? 0),
        description: body.description,
        assignment: body.assignment as ManualConsolidadoAssignmentLabel,
        transferDirection: (body.transferDirection ?? null) as
          | ManualConsolidadoTransferDirectionLabel
          | null,
      });

      return reply.send({
        message: "Lancamento manual criado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao criar lancamento manual.",
      });
    }
  });

  app.put("/consolidado-manual/lancamentos/:id", async (request, reply) => {
    try {
      const params = request.params as {
        id: string;
      };

      const body = request.body as {
        accountId?: string;
        date?: string;
        amount?: number;
        description?: string;
        assignment?: string;
        transferDirection?: string | null;
        status?: string;
      };

      if (
        body.assignment &&
        !isManualConsolidadoAssignment(body.assignment)
      ) {
        return reply.status(400).send({
          error: "A classificacao enviada e invalida.",
        });
      }

      if (
        body.transferDirection &&
        !isManualConsolidadoTransferDirection(body.transferDirection)
      ) {
        return reply.status(400).send({
          error: "A direcao da transferencia enviada e invalida.",
        });
      }

      if (body.status && !isManualConsolidadoStatus(body.status)) {
        return reply.status(400).send({
          error: "O status enviado e invalido.",
        });
      }

      const result = await updateManualConsolidadoEntry({
        id: params.id,
        ...(body.accountId !== undefined ? { accountId: body.accountId } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.assignment !== undefined
          ? {
              assignment:
                body.assignment as ManualConsolidadoAssignmentLabel,
            }
          : {}),
        ...(body.transferDirection !== undefined
          ? {
              transferDirection:
                body.transferDirection as
                  | ManualConsolidadoTransferDirectionLabel
                  | null,
            }
          : {}),
        ...(body.status !== undefined
          ? {
              status: body.status as ManualConsolidadoStatusLabel,
            }
          : {}),
      });

      return reply.send({
        message: "Lancamento manual atualizado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao atualizar lancamento manual.",
      });
    }
  });

  app.delete("/consolidado-manual/lancamentos/:id", async (request, reply) => {
    try {
      const params = request.params as {
        id: string;
      };

      const result = await deleteManualConsolidadoEntry(params.id);

      return reply.send({
        message: "Lancamento manual excluido com sucesso.",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir lancamento manual.",
      });
    }
  });
}
