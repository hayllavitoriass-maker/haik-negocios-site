import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { sessions, users, type User } from "@/server/db/schema";
import { hmacShort, randomToken, sha256 } from "./crypto";
import { isProd } from "@/lib/env";

export const SESSION_COOKIE = "haik_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MFA_PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutos para concluir o 2º fator

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "mfaEnabled" | "isActive">;
export type CurrentSession = {
  sessionId: string;
  mfaVerified: boolean;
  user: SessionUser;
};

export async function getClientInfo() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  return {
    ipHash: hmacShort(ip),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    expires,
  };
}

/** Cria sessão persistida e grava o cookie. O token em claro só vive no cookie. */
export async function createSession(userId: string, opts: { mfaVerified: boolean }) {
  const db = await getDb();
  const token = randomToken(32);
  const ttl = opts.mfaVerified ? SESSION_TTL_MS : MFA_PENDING_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  const client = await getClientInfo();
  const [row] = await db
    .insert(sessions)
    .values({ userId, tokenHash: sha256(token), mfaVerified: opts.mfaVerified, expiresAt, ...client })
    .returning({ id: sessions.id });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return row.id;
}

/** Promove uma sessão pendente de MFA para sessão completa (rotaciona o token). */
export async function completeMfaForSession(sessionId: string) {
  const db = await getDb();
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .update(sessions)
    .set({ tokenHash: sha256(token), mfaVerified: true, expiresAt })
    .where(eq(sessions.id, sessionId));
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsForUser(userId: string) {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Lê a sessão atual a partir do cookie. Memoizada por request (React cache).
 * Sessões expiradas ou de usuários desativados são tratadas como inexistentes.
 */
export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({
      sessionId: sessions.id,
      mfaVerified: sessions.mfaVerified,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        mfaEnabled: users.mfaEnabled,
        isActive: users.isActive,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.user.isActive) return null;
  return row;
});

export async function pruneExpiredSessions() {
  const db = await getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
