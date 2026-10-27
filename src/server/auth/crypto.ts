import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { getAppSecret } from "@/lib/env";

type ScryptOpts = { N: number; r: number; p: number; maxmem: number };
function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOpts): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/**
 * Hash de senha com scrypt (recomendação OWASP: N=2^17, r=8, p=1).
 * Formato: scrypt$N$r$p$salt$hash (base64url). Sem dependências nativas.
 */
const SCRYPT_N = 1 << 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 256 * 1024 * 1024,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const key = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
    maxmem: 256 * 1024 * 1024,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Token aleatório opaco (sessões, reset de senha). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256 em hex. Usado para armazenar tokens sem guardá-los em claro. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** HMAC com APP_SECRET: anonimiza IPs antes de persistir (LGPD, minimização). */
export function hmacShort(value: string): string {
  return createHmac("sha256", getAppSecret()).update(value).digest("base64url").slice(0, 24);
}

function deriveKey(): Buffer {
  return createHash("sha256").update(`haik-enc:${getAppSecret()}`).digest();
}

/** AES-256-GCM para segredos pequenos (ex.: segredo TOTP). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), enc.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, encB64, tagB64] = payload.split(".");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encB64, "base64url")), decipher.final()]).toString("utf8");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
