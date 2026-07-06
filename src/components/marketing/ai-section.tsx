import { FadeUp } from "@/components/marketing/fade-up";

const CAPABILITIES = [
  {
    label: "Sugestão de checklist",
    action: "Gerar checklist",
    description: "A IA propõe seções, perguntas e pesos de criticidade a partir da norma e do setor.",
  },
  {
    label: "Classificação de NC",
    action: "Classificar severidade",
    description: "A IA analisa a descrição da não conformidade e sugere a severidade — crítica, maior, menor ou observação.",
  },
  {
    label: "Redação de plano de ação",
    action: "Gerar plano de ação",
    description: "A IA redige contenção, ação corretiva e preventiva a partir da NC registrada.",
  },
];

export function AISection() {
  return (
    <section id="ia" aria-labelledby="ai-heading" className="border-t border-border bg-primary">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeUp className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wide text-primary-foreground/70">
            Inteligência artificial
          </p>
          <h2
            id="ai-heading"
            className="mt-2 text-2xl font-bold text-primary-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            IA que trabalha como assistente técnico. Não como mágica.
          </h2>
        </FadeUp>

        <FadeUp className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.label}
              className="rounded border border-primary-foreground/15 p-5"
            >
              <p className="font-mono text-[11px] uppercase tracking-wide text-primary-foreground/60">
                {cap.label}
              </p>
              <span className="mt-3 inline-flex rounded border border-primary-foreground/25 px-3 py-1.5 font-mono text-xs text-primary-foreground">
                {cap.action}
              </span>
              <p className="mt-4 text-sm text-primary-foreground/80">{cap.description}</p>
              <p className="mt-3 text-xs text-primary-foreground/60">
                Você revisa e aprova antes de salvar.
              </p>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
