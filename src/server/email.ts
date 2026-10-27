import "server-only";
import { env, isProd } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; html?: string };

/**
 * Envio de e-mail transacional via SMTP (nodemailer). Sem SMTP configurado, nada é
 * enviado: em desenvolvimento o conteúdo vai para o log para permitir testes locais.
 * Retorna true quando o e-mail foi efetivamente entregue ao servidor SMTP.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    if (!isProd) {
      console.info(`[email:dev] para=${mail.to} assunto="${mail.subject}"\n${mail.text}`);
    } else {
      console.warn("[email] SMTP não configurado; e-mail não enviado:", mail.subject);
    }
    return false;
  }
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  await transport.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return true;
}

export function isMailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}
