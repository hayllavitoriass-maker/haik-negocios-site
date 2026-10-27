import Link from "next/link";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { passwordResets } from "@/server/db/schema";
import { sha256 } from "@/server/auth/crypto";
import { ResetForm } from "@/components/admin/AuthForms";
import { Alert } from "@/components/admin/ui";

export const metadata = { title: "Redefinir senha" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let valid = false;
  if (token && token.length >= 16 && token.length <= 200) {
    const db = await getDb();
    const rows = await db
      .select({ id: passwordResets.id })
      .from(passwordResets)
      .where(and(eq(passwordResets.tokenHash, sha256(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
      .limit(1);
    valid = rows.length > 0;
  }
  if (!valid || !token) {
    return (
      <div className="grid gap-4">
        <h1 className="font-sans text-[20px] font-semibold">Link inválido</h1>
        <Alert tone="red">Este link de redefinição é inválido ou expirou. Peça um novo.</Alert>
        <Link href="/admin/recuperar" className="text-center text-[13px] text-grey-500 underline-offset-2 hover:underline">
          Pedir novo link
        </Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
