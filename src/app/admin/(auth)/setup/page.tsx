import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { countUsers } from "@/server/auth/users";
import { SetupForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Configuração inicial" };

/** Só existe enquanto não houver usuários E o token de setup estiver configurado. */
export default async function SetupPage() {
  if (!env.ADMIN_SETUP_TOKEN?.trim()) notFound();
  if ((await countUsers()) > 0) notFound();
  return <SetupForm />;
}
