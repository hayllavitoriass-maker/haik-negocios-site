import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { users, type UserRole } from "@/server/db/schema";
import { hashPassword } from "./crypto";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(users);
  return Number(row?.n ?? 0);
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: { email: string; name: string; password: string; role: UserRole }) {
  const db = await getDb();
  const [row] = await db
    .insert(users)
    .values({
      email: normalizeEmail(input.email),
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
    })
    .returning();
  return row;
}

/** Política mínima de senha: 12+ caracteres. Verificação de senhas vazadas fica como melhoria futura. */
export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 12) return "A senha precisa ter pelo menos 12 caracteres.";
  if (password.length > 200) return "A senha é longa demais.";
  if (/^(.)\1+$/.test(password)) return "Escolha uma senha menos previsível.";
  return null;
}
