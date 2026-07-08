import { FadeUp } from "@/components/marketing/fade-up";

const STEPS = [
  {
    number: "01",
    title: "Planeje",
    description: "Crie a auditoria a partir de um checklist — por norma, unidade ou processo.",
  },
  {
    number: "02",
    title: "Execute",
    description: "Responda no tablet ou celular, anexe fotos e evidências direto em campo.",
  },
  {
    number: "03",
    title: "Trate",
    description: "NCs viram planos de ação com responsável e prazo, sem ficar esquecidas.",
  },
  {
    number: "04",
    title: "Comprove",
    description: "Relatório com score e histórico auditável, pronto para o auditor externo.",
  },
];

export function StepsGrid() {
  return (
    <section id="como-funciona" aria-labelledby="steps-heading" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeUp>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Como funciona
          </p>
          <h2
            id="steps-heading"
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Um processo, do planejamento à comprovação.
          </h2>
        </FadeUp>

        <FadeUp className="mt-10 grid grid-cols-1 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="border-r border-b border-border p-6">
              <p className="font-mono text-3xl font-bold text-primary">{step.number}</p>
              <h3
                className="mt-3 text-sm font-semibold uppercase tracking-wide text-foreground"
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
