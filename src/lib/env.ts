import "server-only";
import { z } from "zod";

/**
 * Leitura validada das variáveis de ambiente do servidor.
 * Valores sensíveis nunca chegam ao cliente (nenhum prefixo NEXT_PUBLIC_).
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  APP_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().optional(),
  DB_AUTO_MIGRATE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  PGLITE_DATA_DIR: z.string().optional(),
  ADMIN_SETUP_TOKEN: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  NOTIFY_EMAIL: z.string().optional(),
  DATA_RETENTION_DAYS: z.coerce.number().default(730),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Variáveis de ambiente inválidas: ${parsed.error.message}`);
}

export const env = parsed.data;

/**
 * APP_SECRET é obrigatório em produção. Em desenvolvimento/testes usamos um valor
 * derivado estável para não bloquear o trabalho local, com aviso explícito no log.
 */
export function getAppSecret(): string {
  if (env.APP_SECRET) return env.APP_SECRET;
  if (env.NODE_ENV === "production") {
    throw new Error("APP_SECRET não configurado. Defina um segredo com pelo menos 32 caracteres.");
  }
  if (!globalThis.__haikSecretWarned) {
    globalThis.__haikSecretWarned = true;
    console.warn("[haik] APP_SECRET ausente: usando segredo de desenvolvimento. Não use em produção.");
  }
  return "dev-only-secret-haik-negocios-nao-usar-em-producao-0000";
}

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test" || process.env.VITEST === "true";

declare global {
  var __haikSecretWarned: boolean | undefined;
}
