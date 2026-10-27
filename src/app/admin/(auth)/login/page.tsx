import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { LoginForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; ok?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) {
    redirect(session.user.mfaEnabled && !session.mfaVerified ? "/admin/login/mfa" : "/admin");
  }
  return <LoginForm next={sp.next} ok={sp.ok} />;
}
