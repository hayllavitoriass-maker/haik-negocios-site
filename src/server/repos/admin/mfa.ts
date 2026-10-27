import "server-only";
import { cookies } from "next/headers";
import { decryptSecret } from "@/server/auth/crypto";

export const MFA_PENDING_COOKIE = "haik_mfa_pending";
export const MFA_PENDING_TTL_S = 10 * 60;

/** Lê o segredo TOTP pendente (cookie criptografado, atrelado ao usuário). */
export async function readPendingMfaSecret(userId: string): Promise<string | null> {
  const raw = (await cookies()).get(MFA_PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const plain = decryptSecret(raw);
    const sep = plain.indexOf(":");
    if (sep < 0 || plain.slice(0, sep) !== userId) return null;
    return plain.slice(sep + 1);
  } catch {
    return null;
  }
}
