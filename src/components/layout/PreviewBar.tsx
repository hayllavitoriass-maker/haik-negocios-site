/** Barra fixa mostrada ao editor quando a pré-visualização de rascunhos está ativa. */
export function PreviewBar() {
  return (
    <div className="fixed inset-x-0 top-[var(--header-h)] z-[21] flex items-center justify-center gap-3 bg-red px-3 py-1.5 text-[12px] text-white" role="status">
      <span className="mono">Pré-visualização de rascunhos ativa</span>
      <form action="/admin/conteudo/sair-preview" method="post">
        <button type="submit" className="mono rounded-xs bg-white/15 px-2 py-1 hover:bg-white/25">
          Sair
        </button>
      </form>
    </div>
  );
}
