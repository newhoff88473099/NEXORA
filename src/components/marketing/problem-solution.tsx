import { FadeUp } from "@/components/marketing/fade-up";

const ROWS = [
  {
    problem: "Planilhas paralelas para cada auditor, cada uma com uma versão diferente.",
    solution: "Um único checklist versionado — a mesma fonte para toda a auditoria.",
  },
  {
    problem: "Fotos de evidência soltas no grupo do WhatsApp, sem vínculo com a NC.",
    solution: "Evidências anexadas direto na não conformidade, rastreáveis desde o campo.",
  },
  {
    problem: "NC registrada em ata e esquecida até a próxima auditoria.",
    solution: "Toda NC vira plano de ação com responsável e prazo, monitorado até o fechamento.",
  },
  {
    problem: "Zero histórico — cada auditoria começa do zero.",
    solution: "Histórico completo por unidade, com tendência de score e reincidência.",
  },
];

export function ProblemSolution() {
  return (
    <section aria-labelledby="problem-solution-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id="problem-solution-heading" className="sr-only">
          Hoje versus com o NEXORA
        </h2>
        <FadeUp className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Hoje</p>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {ROWS.map((row) => (
                <li key={row.problem} className="py-4 text-sm text-foreground sm:text-base">
                  {row.problem}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 md:mt-0">
            <p className="font-mono text-xs uppercase tracking-wide text-primary">Com o NEXORA</p>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {ROWS.map((row) => (
                <li key={row.solution} className="py-4 text-sm text-foreground sm:text-base">
                  {row.solution}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
