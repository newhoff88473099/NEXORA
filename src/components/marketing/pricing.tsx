import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/marketing/fade-up";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "R$ 99,00",
    features: ["1 unidade", "5 usuários", "Checklists e NCs ilimitados", "Relatórios com score"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "R$ 199,00",
    features: ["3 unidades", "20 usuários", "Tudo do Starter", "IA incluída"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "R$ 499,00",
    features: ["Unidades ilimitadas", "Usuários ilimitados", "SSO", "Onboarding dedicado"],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="planos" aria-labelledby="pricing-heading" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeUp className="text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Planos</p>
          <h2
            id="pricing-heading"
            className="mt-2 text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cobrança mensal, sem surpresa.
          </h2>
        </FadeUp>

        <FadeUp className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded border bg-card",
                plan.highlight ? "border-primary" : "border-border"
              )}
            >
              {plan.highlight && <div className="h-1.5 w-full" style={{ background: "var(--hazard-stripe)" }} />}
              <div className="flex flex-1 flex-col p-6">
                <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{plan.name}</p>
                <p className="mt-3 font-mono text-3xl font-bold text-foreground">
                  {plan.price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  render={<Link href="/login" />}
                  nativeButton={false}
                  className="mt-6"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  Começar grátis
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  15 dias grátis, sem cartão
                </p>
              </div>
            </div>
          ))}
        </FadeUp>

        <p className="mt-10 text-center font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Dados hospedados no Brasil · Conformidade LGPD
        </p>
      </div>
    </section>
  );
}
