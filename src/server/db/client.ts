import "server-only";
import path from "node:path";
import { drizzle as drizzleNode, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

/**
 * Conexão com o banco.
 *
 * - `DATABASE_URL` definido → Postgres externo (Supabase, Neon, RDS...) via node-postgres.
 * - Sem `DATABASE_URL` → PGlite (Postgres embutido em WASM) gravado em `./data/pglite`,
 *   ou em memória quando `PGLITE_DATA_DIR=memory://` (testes).
 *
 * A instância é guardada em `globalThis` para sobreviver ao hot reload do Next em dev.
 * O tipo exposto é o do node-postgres; a variante PGlite é compatível na API de consulta.
 */
export type Database = NodePgDatabase<typeof schema>;

type DbGlobal = {
  __haikDb?: Promise<Database>;
  __haikPgliteDir?: string;
};
const g = globalThis as unknown as DbGlobal;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

async function createDb(): Promise<Database> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: url.includes("sslmode=disable") || url.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
    const db = drizzleNode(pool, { schema });
    if (process.env.DB_AUTO_MIGRATE === "true" || process.env.DB_AUTO_MIGRATE === "1") {
      await migrateNode(db, { migrationsFolder: MIGRATIONS_FOLDER });
    }
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DATA_DIR?.trim() || path.join(process.cwd(), "data", "pglite");
  g.__haikPgliteDir = dir;
  if (dir !== "memory://") {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dir, { recursive: true });
  }
  const client = dir === "memory://" ? new PGlite() : new PGlite(dir);
  await client.waitReady;
  const db = drizzlePglite(client, { schema });
  // O banco embutido é sempre migrado automaticamente: não há passo manual em dev/testes.
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!g.__haikDb) {
    g.__haikDb = createDb()
      .then(async (db) => {
        const { ensureSeedData } = await import("./seed");
        await ensureSeedData(db);
        return db;
      })
      .catch((err) => {
        g.__haikDb = undefined;
        throw err;
      });
  }
  return g.__haikDb;
}

/** Fecha a conexão (usado apenas por scripts e testes). */
export async function resetDbForTests() {
  g.__haikDb = undefined;
}

export { schema };
