import { FastifyInstance } from "fastify";

export async function extratosRoutes(app: FastifyInstance) {
  app.post("/extratos/importar", async (request, reply) => {
    const files = await request.files();

    if (!files) {
      return reply.status(400).send({ error: "Nenhum arquivo enviado" });
    }

    const result: any[] = [];

    for await (const file of files) {
      result.push({
        fileName: file.filename,
        mimetype: file.mimetype,
      });
    }

    return reply.send({
      message: "Arquivos recebidos com sucesso",
      files: result,
    });
  });
}
