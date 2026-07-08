import { ListChecks, ClipboardCheck, AlertTriangle, Wrench, FileText, Building2 } from "lucide-react";
import { FadeUp } from "@/components/marketing/fade-up";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Checklists personalizáveis",
    description: "Monte checklists por norma ou processo, com pesos de criticidade por item.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditorias em campo",
    description: "Responda no tablet ou celular, mesmo sem conexão — sincroniza depois.",
  },
  {
    icon: AlertTriangle,
    title: "Gestão de NCs",
    description: "Registre, classifique e acompanhe não conformidades até o fechamento.",
  },
  {
    icon: Wrench,
    title: "Planos de ação com prazos e alertas",
    description: "Responsável, prazo e status — nada fica esquecido.",
  },
  {
    icon: FileText,
    title: "Relatórios e score de conformidade",
    description: "Relatório pronto para o auditor externo, com histórico e score.",
  },
  {
    icon: Building2,
    title: "Multi-unidade e permissões por papel",
    description: "Uma conta, várias unidades, com controle de acesso por papel.",
  },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeUp>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Recursos</p>
          <h2
            id="features-heading"
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tudo que a auditoria precisa, num só lugar.
          </h2>
        </FadeUp>

        <FadeUp className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded border border-border bg-card p-5">
              <Icon size={18} strokeWidth={1.75} className="text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}
