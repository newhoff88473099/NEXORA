import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardMock } from "@/components/marketing/dashboard-mock";
import { FadeUp } from "@/components/marketing/fade-up";

export function Hero() {
  return (
    <section id="produto" aria-labelledby="hero-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Gestão de auditorias industriais
          </p>
          <h1
            id="hero-heading"
            className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Auditorias que saem da prancheta.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Planeje, execute e acompanhe auditorias, não conformidades e planos de ação em um só
            lugar. Sem planilha, sem papel perdido, com rastreabilidade completa.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/login" />} nativeButton={false} size="lg">
              Começar grátis →
            </Button>
            <Button render={<Link href="#como-funciona" />} nativeButton={false} variant="outline" size="lg">
              Ver demonstração
            </Button>
          </div>
        </FadeUp>

        <FadeUp className="mx-auto mt-14 max-w-5xl">
          <DashboardMock />
        </FadeUp>
      </div>
    </section>
  );
}
