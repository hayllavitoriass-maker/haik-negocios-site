import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { env } from "@/lib/env";

/**
 * Abstração de armazenamento de arquivos enviados pelo painel.
 * - local: ./data/uploads (VPS/Docker). Nunca dentro de /public, para não executar nem listar.
 * - s3: qualquer serviço compatível (AWS S3, Cloudflare R2, Supabase Storage S3).
 *
 * As chaves são sempre geradas pelo servidor (sem nome do usuário no caminho), o que
 * impede sobrescrita arbitrária e path traversal.
 */
export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Stream para servir via /media/[...key] (driver local ou S3 sem URL pública). */
  read(key: string): Promise<{ stream: ReadableStream; size?: number } | null>;
}

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export const SAFE_KEY = /^[a-z0-9]+(?:\/[a-z0-9-]+)*\/[a-z0-9-]+\.[a-z0-9]{2,5}$/;

export function isSafeKey(key: string): boolean {
  return SAFE_KEY.test(key) && !key.includes("..");
}

class LocalDriver implements StorageDriver {
  private resolve(key: string) {
    if (!isSafeKey(key)) throw new Error("Chave de arquivo inválida");
    const full = path.resolve(UPLOAD_ROOT, key);
    if (!full.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) throw new Error("Caminho fora do diretório de uploads");
    return full;
  }
  async put(key: string, body: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body, { flag: "wx" }); // falha se já existir: sem sobrescrita
  }
  async delete(key: string) {
    try {
      await unlink(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
  async read(key: string) {
    const full = this.resolve(key);
    try {
      const info = await stat(full);
      const stream = Readable.toWeb(createReadStream(full)) as unknown as ReadableStream;
      return { stream, size: info.size };
    } catch {
      return null;
    }
  }
}

class S3Driver implements StorageDriver {
  private clientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;
  private bucket = env.S3_BUCKET ?? "";

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = import("@aws-sdk/client-s3").then(
        ({ S3Client }) =>
          new S3Client({
            region: env.S3_REGION || "auto",
            endpoint: env.S3_ENDPOINT || undefined,
            forcePathStyle: Boolean(env.S3_ENDPOINT),
            credentials: { accessKeyId: env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "" },
          }),
      );
    }
    return this.clientPromise;
  }
  async put(key: string, body: Buffer, contentType: string) {
    if (!isSafeKey(key)) throw new Error("Chave de arquivo inválida");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.client()).send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        ContentDisposition: "inline",
      }),
    );
  }
  async delete(key: string) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await this.client()).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
  async read(key: string) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const res = await (await this.client()).send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!res.Body) return null;
      return { stream: res.Body.transformToWebStream() as ReadableStream, size: res.ContentLength };
    } catch {
      return null;
    }
  }
}

let driver: StorageDriver | null = null;
export function getStorage(): StorageDriver {
  if (!driver) {
    if (env.STORAGE_DRIVER === "s3") {
      if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
        throw new Error("STORAGE_DRIVER=s3 exige S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY.");
      }
      driver = new S3Driver();
    } else {
      driver = new LocalDriver();
    }
  }
  return driver;
}

export function storageInfo() {
  return { driver: env.STORAGE_DRIVER, serverless: Boolean(process.env.VERCEL) && env.STORAGE_DRIVER === "local" };
}
