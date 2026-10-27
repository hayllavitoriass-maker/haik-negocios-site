/**
 * Aplica as migrations SQL de ./drizzle no banco configurado.
 * Uso: npm run db:migrate
 */
import "dotenv/config";
import path from "node:path";

async function main() {
  const folder = path.join(process.cwd(), "drizzle");
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: folder });
    await pool.end();
    console.log("Migrations aplicadas no Postgres externo.");
    return;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DATA_DIR?.trim() || path.join(process.cwd(), "data", "pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.waitReady;
  await migrate(drizzle(client), { migrationsFolder: folder });
  await client.close();
  console.log(`Migrations aplicadas no PGlite em ${dir}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
