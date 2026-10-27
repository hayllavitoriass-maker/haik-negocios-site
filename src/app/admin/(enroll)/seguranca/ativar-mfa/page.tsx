import QRCode from "qrcode";
import { requireUser } from "@/server/auth/guard";
import { totpUri } from "@/server/auth/totp";
import { cancelMfaEnrollment, startMfaEnrollment } from "@/server/actions/admin/security";
import { readPendingMfaSecret } from "@/server/repos/admin/mfa";
import { MfaConfirmForm } from "@/components/admin/SecurityForms";
import { Alert, buttonClass } from "@/components/admin/ui";

export const metadata = { title: "Ativar MFA" };

/**
 * Fluxo: gerar segredo (cookie criptografado de 10 min) → QR + chave manual → confirmar código.
 * Após a confirmação a página é re-renderizada pelo Next; os filhos têm `key` fixa para que o
 * componente cliente com os códigos de recuperação continue montado (eles aparecem uma única vez).
 */
export default async function EnableMfaPage() {
  const user = await requireUser({ allowMfaEnrollment: true });
  const enabled = user.mfaEnabled;
  const secret = enabled ? null : await readPendingMfaSecret(user.id);
  const qr = secret ? await QRCode.toDataURL(totpUri(secret, user.email), { margin: 1, width: 220, errorCorrectionLevel: "M" }) : null;
  const manual = secret ? (secret.match(/.{1,4}/g)?.join(" ") ?? secret) : null;

  return (
    <div className="grid gap-5">
      <div key="head">
        <h1 className="font-sans text-[20px] font-semibold">{secret ? "Escaneie o QR code" : "Verificação em duas etapas"}</h1>
        <p className="mt-1 text-[13px] text-grey-500">
          {secret
            ? "Abra o aplicativo autenticador, adicione uma conta e aponte a câmera para o código. Depois, digite o código de 6 dígitos gerado."
            : enabled
              ? "O MFA está ativo nesta conta."
              : `${user.role === "admin" ? "Administradores precisam do MFA para usar o painel. " : ""}Você vai precisar de um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator, 1Password, Authy...).`}
        </p>
      </div>

      {secret && qr && (
        <div key="qr" className="grid items-start gap-4 sm:grid-cols-[220px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code para configurar o autenticador" width={220} height={220} className="rounded-xs hairline" />
          <div className="grid gap-2 text-[13px]">
            <p className="text-grey-600">Não consegue escanear? Digite esta chave manualmente (tipo: baseado em tempo):</p>
            <code className="rounded-xs bg-grey-50 p-3 font-mono text-[13px] tracking-wider [overflow-wrap:anywhere]">{manual}</code>
            <p className="text-grey-500">Conta: {user.email} · Emissor: HAIK Negócios</p>
          </div>
        </div>
      )}

      {(secret || enabled) && <MfaConfirmForm key="confirm" alreadyEnabled={enabled} />}

      {!secret && !enabled && (
        <form key="start" action={startMfaEnrollment}>
          <button type="submit" className={buttonClass("primary")}>
            Gerar QR code
          </button>
        </form>
      )}

      {secret && (
        <Alert key="note" tone="neutral">
          Ao confirmar, você recebe 8 códigos de recuperação de uso único. Guarde-os: são a única forma de entrar se perder o celular.
        </Alert>
      )}
      {secret && (
        <form key="cancel" action={cancelMfaEnrollment} className="text-center">
          <button type="submit" className="text-[13px] text-grey-500 underline-offset-2 hover:underline">
            Gerar outro QR code
          </button>
        </form>
      )}
    </div>
  );
}
