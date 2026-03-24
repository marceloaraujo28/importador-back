import type { FastifyInstance } from "fastify";
import { getAccountConfig } from "../modules/extratos/config/account-config";
import { parseBancoBrasilExtrato } from "../modules/extratos/parsers/banco-brasil.parser";
import { confirmExtratosReview } from "../modules/extratos/services/confirm-extratos-review.service";
import { listExtratos } from "../modules/extratos/services/list-extratos.service";
import { getConsolidadoDashboard } from "../modules/dashboard/services/get-consolidado-dashboard.service";
import { listOpeningBalances } from "../modules/dashboard/services/list-opening-balances.service";
import { updateOpeningBalance } from "../modules/dashboard/services/update-opening-balance.service";

function extractAccountIdFromFileName(fileName: string): string | null {
  const match = fileName.toUpperCase().match(/\b[A-Z]{2,3}\d{1,2}\b/);
  return match ? match[0] : null;
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
        signal: "C" | "D";
        assignment:
          | "ENTRADAS"
          | "SAÍDAS"
          | "TARIFAS"
          | "APLICAÇÕES"
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
            transactions,
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

  app.post("/extratos/revisao/confirmar", async (request, reply) => {
    try {
      const body = request.body as {
        transactions?: Array<{
          accountId: string;
          bankName: string;
          companyName: string;
          date: string;
          description: string;
          amount: number;
          signal: "C" | "D";
          assignment:
            | "ENTRADAS"
            | "SAÍDAS"
            | "TARIFAS"
            | "APLICAÇÕES"
            | "RESGATES"
            | "IGNORAR"
            | "OUTROS";
        }>;
      };

      if (!body.transactions || !Array.isArray(body.transactions)) {
        return reply.status(400).send({
          error: "O campo transactions é obrigatório.",
        });
      }

      const result = await confirmExtratosReview({
        transactions: body.transactions,
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

  app.get("/extratos", async (_request, reply) => {
    try {
      const extratos = await listExtratos();

      return reply.send({
        message: "Extratos carregados com sucesso.",
        data: extratos,
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
