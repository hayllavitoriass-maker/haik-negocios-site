import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, hashPassword, hmacShort, randomToken, safeEqual, sha256, verifyPassword } from "@/server/auth/crypto";
import { generateRecoveryCodes, generateTotpSecret, verifyTotp } from "@/server/auth/totp";
import * as OTPAuth from "otpauth";

describe("senhas (scrypt)", () => {
  it("gera hashes diferentes para a mesma senha e verifica corretamente", async () => {
    const a = await hashPassword("uma senha muito segura 123");
    const b = await hashPassword("uma senha muito segura 123");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$131072$8$1$")).toBe(true);
    expect(await verifyPassword("uma senha muito segura 123", a)).toBe(true);
    expect(await verifyPassword("outra", a)).toBe(false);
    expect(await verifyPassword("x", "lixo")).toBe(false);
  }, 20000);
});

describe("tokens e segredos", () => {
  it("tokens são aleatórios e hashes determinísticos", () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(sha256("a")).toBe(sha256("a"));
    expect(hmacShort("1.2.3.4")).toBe(hmacShort("1.2.3.4"));
    expect(hmacShort("1.2.3.4")).not.toBe(hmacShort("1.2.3.5"));
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });
  it("criptografa e descriptografa segredos", () => {
    const enc = encryptSecret("SEGREDO-TOTP");
    expect(enc).not.toContain("SEGREDO");
    expect(decryptSecret(enc)).toBe("SEGREDO-TOTP");
  });
});

describe("TOTP", () => {
  it("valida um código gerado com o mesmo segredo", () => {
    const secret = generateTotpSecret();
    const code = new OTPAuth.TOTP({ secret, digits: 6, period: 30 }).generate();
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(code === "000000");
    expect(verifyTotp(secret, "12")).toBe(false);
  });
  it("gera códigos de recuperação com hashes", () => {
    const { codes, hashes } = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(hashes[0]).toBe(sha256(codes[0]));
  });
});
