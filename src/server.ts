import { buildApp } from "./app";

async function start() {
  const app = buildApp();

  await app.listen({
    port: 3333,
    host: "0.0.0.0",
  });

  console.log("🚀 Server rodando em http://localhost:3333");
}

start();
