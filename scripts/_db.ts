/**
 * Conexão de banco para scripts de linha de comando (fora do Next).
 * Reproduz a lógica de `src/server/db/client.ts` sem importar módulos `server-only`.
 * Também expõe o hash de senha no mesmo formato de `src/server/auth/crypto.ts`.
 */
import "dotenv/config";
import path from "node:path";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../src/server/db/schema";

export type ScriptDb = NodePgDatabase<typeof schema>;

export async function openDb(): Promise<{ db: ScriptDb; close: () => Promise<void> }> {
  const folder = path.join(process.cwd(), "drizzle");
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 2, ssl: url.includes("sslmode=disable") || url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    const db = drizzle(pool, { schema });
    return { db, close: () => pool.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DATA_DIR?.trim() || path.join(process.cwd(), "data", "pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.waitReady;
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: folder });
  return { db: db as unknown as ScriptDb, close: () => client.close() };
}

export { schema };

/** Lê um argumento `--nome valor` ou `--nome=valor`. */
export function arg(name: string): string | undefined {
  const argv = process.argv.slice(2);
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return undefined;
  const a = argv[i];
  if (a.includes("=")) return a.slice(a.indexOf("=") + 1);
  return argv[i + 1];
}

export function flag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
}

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/** Pergunta uma senha no terminal sem eco (quando há TTY). */
export async function promptPassword(question: string): Promise<string> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const stdout = process.stdout as NodeJS.WriteStream & { muted?: boolean };
  return new Promise((resolve) => {
    stdout.write(question);
    const origWrite = stdout.write.bind(stdout);
    // Silencia o eco enquanto a senha é digitada.
    (stdout as unknown as { write: typeof origWrite }).write = ((chunk: unknown, ...rest: unknown[]) => {
      if (typeof chunk === "string" && chunk.includes("\n")) return (origWrite as (...a: unknown[]) => boolean)(chunk, ...rest);
      return true;
    }) as typeof origWrite;
    rl.question("", (answer) => {
      (stdout as unknown as { write: typeof origWrite }).write = origWrite;
      stdout.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

const SCRYPT_N = 1 << 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 }, (err, key) => {
      if (err) return reject(err);
      resolve(["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), key.toString("base64url")].join("$"));
    });
  });
}

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 12) return "A senha precisa ter pelo menos 12 caracteres.";
  if (password.length > 200) return "A senha é longa demais.";
  if (/^(.)\1+$/.test(password)) return "Escolha uma senha menos previsível.";
  return null;
}
