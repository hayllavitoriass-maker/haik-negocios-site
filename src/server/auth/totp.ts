import "server-only";
import * as OTPAuth from "otpauth";
import { randomBytes } from "node:crypto";
import { sha256 } from "./crypto";

const ISSUER = "HAIK Negócios";

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function totpUri(secret: string, label: string): string {
  return new OTPAuth.TOTP({ issuer: ISSUER, label, algorithm: "SHA1", digits: 6, period: 30, secret }).toString();
}

/** Valida um código TOTP aceitando uma janela de ±1 período (30s) para tolerar relógio dessincronizado. */
export function verifyTotp(secret: string, code: string): boolean {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const totp = new OTPAuth.TOTP({ issuer: ISSUER, algorithm: "SHA1", digits: 6, period: 30, secret });
  return totp.validate({ token: clean, window: 1 }) !== null;
}

/** Gera 8 códigos de recuperação (formato xxxx-xxxx) e os hashes para armazenar. */
export function generateRecoveryCodes(): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: 8 }, () => {
    const raw = randomBytes(5).toString("hex");
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
  });
  return { codes, hashes: codes.map((c) => sha256(c)) };
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, "");
}
