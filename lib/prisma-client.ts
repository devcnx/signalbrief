import "dotenv/config";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export function createPrismaClient(): PrismaClient {
  const dbPath = process.env.DATABASE_URL?.replace("file:", "").split("?")[0] || "./dev.db";
  const absolutePath = path.resolve(dbPath);
  const adapter = new PrismaBetterSqlite3({ url: "file:" + absolutePath });
  return new PrismaClient({ adapter });
}
