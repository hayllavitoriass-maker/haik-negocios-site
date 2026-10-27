import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { MfaForm } from "@/components/admin/AuthForms";
import { logout } from "@/server/actions/admin/auth";

export const metadata = { title: "Verificação em duas etapas" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.user.mfaEnabled || session.mfaVerified) redirect("/admin");
  return (
    <>
      <MfaForm next={sp.next} />
      <form action={logout} className="mt-4 text-center">
        <button type="submit" className="text-[13px] text-grey-500 underline-offset-2 hover:underline">
          Entrar com outra conta
        </button>
      </form>
    </>
  );
}
