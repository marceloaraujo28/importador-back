import type { FastifyInstance } from "fastify";
import { getAccountConfig } from "../modules/extratos/config/account-config";
import { parseBancoBrasilExtrato } from "../modules/extratos/parsers/banco-brasil.parser";
import { parseBradescoExtrato } from "../modules/extratos/parsers/bradesco.parser";
import { parseBradescoTrianonExtrato } from "../modules/extratos/parsers/bradesco-trianon.parser";
import { parseCaixaExtrato } from "../modules/extratos/parsers/caixa.parser";
import { confirmExtratosReview } from "../modules/extratos/services/confirm-extratos-review.service";
import { listExtratos } from "../modules/extratos/services/list-extratos.service";
import { getConsolidadoDashboard } from "../modules/dashboard/services/get-consolidado-dashboard.service";
import { listOpeningBalances } from "../modules/dashboard/services/list-opening-balances.service";
import { updateOpeningBalance } from "../modules/dashboard/services/update-opening-balance.service";
import { parseItauExtrato } from "../modules/extratos/parsers/itau.parser";
import { parseSafraExtrato } from "../modules/extratos/parsers/safra.parser";
import { parseSantanderExtrato } from "../modules/extratos/parsers/santander.parser";
import { updateExtratos } from "../modules/extratos/services/update-extratos.service";
import { exportExtratos } from "../modules/extratos/services/export-extratos.service";
import { deleteExtrato } from "../modules/extratos/services/delete-extrato.service";
import {
  saveExtratos,
  type SaveExtratosInput,
} from "../modules/extratos/services/save-extratos.service";

function extractAccountIdFromFileName(fileName: string): string | null {
  const match = fileName.toUpperCase().match(/\b[A-Z]{2,3}\d{1,2}\b/);
  return match ? match[0] : null;
}

function hasExtratosExportFilters(input: {
  assignment?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  amount?: string | undefined;
  description?: string | undefined;
  accountIds?: string[] | undefined;
  bankNames?: string[] | undefined;
}) {
  return Boolean(
    input.assignment ||
      input.dateFrom ||
      input.dateTo ||
      input.amount !== undefined ||
      input.description ||
      input.accountIds?.length ||
      input.bankNames?.length,
  );
}

export async function extratosRoutes(app: FastifyInstance) {
  app.post("/extratos/importar", async (request, reply) => {
    const files = request.files();

    const processedFiles: Array<{
      fileName: string;
      accountId: string | null;
      bankName: string | null;
      companyName: string | null;
      parser: string | null;
      mimetype: string;
      size: number;
      transactions?: Array<{
        accountId: string;
        bankName: string;
        companyName: string;
        date: string;
        description: string;
        amount: number;
        ignoreDailySummary?: boolean;
        signal: "C" | "D";
        assignment:
          | "ENTRADAS"
          | "SAÍDAS"
          | "TARIFAS"
          | "APLICAÇÕES"
          | "RENDIMENTOS"
          | "RESGATES"
          | "IGNORAR"
          | "OUTROS";
      }>;
      error?: string;
    }> = [];

    for await (const file of files) {
      const buffer = await file.toBuffer();
      const accountId = extractAccountIdFromFileName(file.filename);

      const baseResult = {
        fileName: file.filename,
        accountId,
        bankName: null as string | null,
        companyName: null as string | null,
        parser: null as string | null,
        mimetype: file.mimetype,
        size: buffer.length,
      };

      if (!accountId) {
        processedFiles.push({
          ...baseResult,
          error:
            "Não foi possível identificar o ID da conta pelo nome do arquivo.",
        });
        continue;
      }

      const accountConfig = getAccountConfig(accountId);

      if (!accountConfig) {
        processedFiles.push({
          ...baseResult,
          error: `Conta ${accountId} não encontrada no mapeamento.`,
        });
        continue;
      }

      const enrichedBaseResult = {
        ...baseResult,
        bankName: accountConfig.bankName,
        companyName: accountConfig.companyName,
      };

      try {
        if (accountConfig.bankName === "BANCO DO BRASIL") {
          const transactions = parseBancoBrasilExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_DO_BRASIL",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "CAIXA ECONÔMICA FEDERAL") {
          const transactions = parseCaixaExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "CAIXA_ECONOMICA_FEDERAL",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "BANCO ITAÚ") {
          const transactions = parseItauExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_ITAU",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "BANCO SAFRA") {
          const transactions = parseSafraExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_SAFRA",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "BANCO SANTANDER") {
          const transactions = parseSantanderExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_SANTANDER",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "BANCO BRADESCO") {
          const transactions = parseBradescoExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_BRADESCO",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        if (accountConfig.bankName === "BANCO BRADESCO TRIANON") {
          const transactions = parseBradescoTrianonExtrato({
            accountId: accountConfig.accountId,
            bankName: accountConfig.bankName,
            companyName: accountConfig.companyName,
            buffer,
          });

          processedFiles.push({
            ...enrichedBaseResult,
            parser: "BANCO_BRADESCO_TRIANON",
            transactions: transactions.map((transaction) => ({
              ...transaction,
              ignoreDailySummary: false,
            })),
          });

          continue;
        }

        processedFiles.push({
          ...enrichedBaseResult,
          error: `Ainda não existe parser implementado para o banco ${accountConfig.bankName}.`,
        });
      } catch (error) {
        processedFiles.push({
          ...enrichedBaseResult,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao processar o arquivo.",
        });
      }
    }

    if (!processedFiles.length) {
      return reply.status(400).send({ error: "Nenhum arquivo enviado" });
    }

    return reply.send({
      message: "Arquivos processados",
      files: processedFiles,
    });
  });

  app.get("/extratos/exportar", async (request, reply) => {
    try {
      const query = request.query as {
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
        amountOrder?: "asc" | "desc";
        description?: string;
        amount?: string;
        accountId?: string | string[];
        bankName?: string | string[];
      };

      const accountIds = Array.isArray(query.accountId)
        ? query.accountId
        : query.accountId
          ? [query.accountId]
          : [];

      const bankNames = Array.isArray(query.bankName)
        ? query.bankName
        : query.bankName
          ? [query.bankName]
          : [];

      if (
        !hasExtratosExportFilters({
          assignment: query.assignment,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          amount: query.amount,
          description: query.description,
          accountIds,
          bankNames,
        })
      ) {
        return reply.status(400).send({
          error:
            "Aplique ao menos um filtro antes de exportar os extratos.",
        });
      }

      const buffer = await exportExtratos({
        ...(query.assignment ? { assignment: query.assignment } : {}),
        ...(query.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query.dateTo ? { dateTo: query.dateTo } : {}),
        ...(query.amountOrder === "asc" || query.amountOrder === "desc"
          ? { amountOrder: query.amountOrder }
          : {}),
        ...(query.description ? { description: query.description } : {}),
        ...(query.amount !== undefined ? { amount: Number(query.amount) } : {}),
        ...(accountIds.length ? { accountIds } : {}),
        ...(bankNames.length ? { bankNames } : {}),
      });

      const fileName = "extratos.xlsx";

      reply
        .header(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .header("Content-Disposition", `attachment; filename="${fileName}"`);

      return reply.send(buffer);
    } catch (error) {
      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao exportar extratos.",
      });
    }
  });

  app.post("/extratos/revisao/confirmar", async (request, reply) => {
    try {
      const body = request.body as SaveExtratosInput;

      if (!body.transactions || !Array.isArray(body.transactions)) {
        return reply.status(400).send({
          error: "O campo transactions é obrigatório.",
        });
      }

      const result = await confirmExtratosReview({
        transactions: body.transactions as SaveExtratosInput["transactions"],
      });

      return reply.send({
        message: "Revisão dos extratos salva com sucesso.",
        savedCount: result.savedCount,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao salvar revisão dos extratos.",
      });
    }
  });

  app.post("/extratos", async (request, reply) => {
    try {
      const body = request.body as {
        transactions?: Array<{
          accountId: string;
          bankName: string;
          companyName: string;
          date: string;
          description: string;
          amount: number;
          ignoreDailySummary?: boolean;
          signal: "C" | "D";
          assignment:
            | "ENTRADAS"
            | "SAÍDAS"
            | "TARIFAS"
            | "RENDIMENTOS"
            | "RENDIMENTO MENSAL"
            | "APLICAÇÕES"
            | "RESGATES"
            | "TRANSFERÊNCIA EC"
            | "IGNORAR"
            | "OUTROS";
        }>;
      };

      if (!body.transactions || !Array.isArray(body.transactions)) {
        return reply.status(400).send({
          error: "O campo transactions é obrigatório.",
        });
      }

      const result = await saveExtratos({
        transactions: body.transactions as SaveExtratosInput["transactions"],
      });

      return reply.send({
        message: "Extratos salvos com sucesso.",
        savedCount: result.savedCount,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao salvar extratos.",
      });
    }
  });

  app.get("/extratos", async (request, reply) => {
    try {
      const query = request.query as {
        page?: string;
        pageSize?: string;
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
        amountOrder?: "asc" | "desc";
        description?: string;
        amount?: string;
        accountId?: string | string[];
        bankName?: string | string[];
      };

      const accountIds = Array.isArray(query.accountId)
        ? query.accountId
        : query.accountId
          ? [query.accountId]
          : [];

      const bankNames = Array.isArray(query.bankName)
        ? query.bankName
        : query.bankName
          ? [query.bankName]
          : [];

      const result = await listExtratos({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 50),
        ...(query.assignment ? { assignment: query.assignment } : {}),
        ...(query.amount !== undefined ? { amount: Number(query.amount) } : {}),
        ...(query.description ? { description: query.description } : {}),
        ...(query.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query.dateTo ? { dateTo: query.dateTo } : {}),
        ...(accountIds.length ? { accountIds } : {}),
        ...(bankNames.length ? { bankNames } : {}),
        ...(query.amountOrder === "asc" || query.amountOrder === "desc"
          ? { amountOrder: query.amountOrder }
          : {}),
      });

      return reply.send({
        message: "Extratos carregados com sucesso.",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao buscar extratos.",
      });
    }
  });

  app.put("/extratos", async (request, reply) => {
    try {
      const body = request.body as {
        updates?: Array<{
          id: string;
          amount?: number;
          ignoreDailySummary?: boolean;
          assignment:
            | "ENTRADAS"
            | "SAÍDAS"
            | "TARIFAS"
            | "APLICAÇÕES"
            | "RENDIMENTOS"
            | "RENDIMENTO MENSAL"
            | "RESGATES"
            | "TRANSFERÊNCIA EC"
            | "OUTROS";
        }>;
      };

      if (!body.updates || !Array.isArray(body.updates)) {
        return reply.status(400).send({
          error: "O campo updates é obrigatório.",
        });
      }

      const result = await updateExtratos({
        updates: body.updates,
      });

      return reply.send({
        message: "Extratos atualizados com sucesso.",
        updatedCount: result.updatedCount,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao atualizar extratos.",
      });
    }
  });

  app.delete("/extratos/:id", async (request, reply) => {
    try {
      const params = request.params as {
        id: string;
      };

      const result = await deleteExtrato(params.id);

      return reply.send({
        message: "Extrato excluído com sucesso.",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir extrato.",
      });
    }
  });

  app.get("/dashboard/consolidado", async (request, reply) => {
    try {
      const query = request.query as {
        dateFrom?: string;
        dateTo?: string;
        companyName?: string;
        groupName?: string;
      };

      const filters = {
        ...(query.dateFrom ? { dateFrom: query.dateFrom } : {}),
        ...(query.dateTo ? { dateTo: query.dateTo } : {}),
        ...(query.companyName ? { companyName: query.companyName } : {}),
        ...(query.groupName ? { groupName: query.groupName } : {}),
      };

      const result = await getConsolidadoDashboard(filters);

      return reply.send({
        message: "Dashboard consolidado carregado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar dashboard consolidado.",
      });
    }
  });

  app.get("/accounts/opening-balances", async (_request, reply) => {
    try {
      const result = await listOpeningBalances();

      return reply.send({
        message: "Saldos iniciais carregados com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar saldos iniciais.",
      });
    }
  });

  app.put("/accounts/opening-balances/:accountCode", async (request, reply) => {
    try {
      const params = request.params as {
        accountCode: string;
      };

      const body = request.body as {
        referenceDate?: string | null;
        initialAvailable?: number;
        initialApplication?: number;
      };

      const result = await updateOpeningBalance({
        accountCode: params.accountCode,
        referenceDate: body.referenceDate ?? null,
        initialAvailable: Number(body.initialAvailable ?? 0),
        initialApplication: Number(body.initialApplication ?? 0),
      });

      return reply.send({
        message: "Saldo inicial atualizado com sucesso.",
        data: result,
      });
    } catch (error) {
      return reply.status(400).send({
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao atualizar saldo inicial.",
      });
    }
  });
}
