import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
console.log("Prisma DATABASE_URL:", connectionString);

const adapter = new PrismaBetterSqlite3({
  url: connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});
