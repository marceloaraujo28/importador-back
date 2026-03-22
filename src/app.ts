import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { extratosRoutes } from "./routes/extratos.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });
  app.register(cors, {
    origin: "*",
  });
  // plugin para upload de arquivos
  app.register(multipart);
  // registrar rota de extratos
  app.register(extratosRoutes);

  return app;
}
