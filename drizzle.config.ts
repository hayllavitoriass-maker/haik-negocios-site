import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit só precisa do schema para gerar migrations SQL (`npm run db:generate`).
 * A aplicação das migrations é feita por `src/server/db/migrate.ts`, que funciona
 * tanto no Postgres externo quanto no PGlite embutido.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/haik",
  },
  strict: true,
  verbose: true,
});
