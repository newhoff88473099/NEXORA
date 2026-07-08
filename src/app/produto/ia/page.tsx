import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "IA para Auditorias Industriais — Checklist, NC e Causa Raiz Automáticos | NEXORA",
  description:
    "A IA do NEXORA gera checklists de auditoria, redige não conformidades e sugere causa raiz com os 5 Porquês. Você revisa, a IA acelera o trabalho pesado.",
};

const CAPABILITIES = [
  {
    title: "Checklist em minutos",
    description:
      "Cole o texto de uma norma (ISO 9001, NR-12...) e a IA gera seções, perguntas e pesos de criticidade para sua auditoria.",
  },
  {
    title: "NC redigida automaticamente",
    description:
      "A partir da nota do auditor, a IA escreve a descrição formal da não conformidade já referenciando a cláusula normativa.",
  },
  {
    title: "Causa raiz sem travar",
    description:
      "A IA aplica os 5 Porquês e sugere ações de contenção, corretiva e preventiva — você ajusta e aprova.",
  },
];

export default function ProdutoIaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Image
              src="/nexora-logo.png"
              alt="NEXORA"
              width={140}
              height={44}
              className="object-contain"
              priority
            />
          </Link>
          <Button render={<Link href="/login" />} nativeButton={false} size="sm" variant="outline">
            Entrar
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-16 text-center sm:py-24">
          <h1
            className="text-3xl font-semibold text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sua auditoria com um co-piloto de IA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            O NEXORA usa IA para montar checklists, redigir não conformidades e sugerir causa
            raiz — você continua no controle, a IA elimina a página em branco.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/login" />} nativeButton={false} size="lg">
              Comece seu teste grátis de 15 dias
            </Button>
            <p className="text-xs text-muted-foreground">Sem cartão de crédito</p>
          </div>
        </section>

        <section className="grid gap-4 border-t border-border py-16 sm:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded border border-border bg-card p-5">
              <h2 className="text-sm font-medium text-foreground">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-border py-16">
          <div className="rounded border border-border bg-muted/30 p-6">
            <p className="text-sm text-foreground">
              <span className="font-medium">A IA nunca inventa referência normativa:</span>{" "}
              quando não tem certeza da cláusula, ela deixa em branco para você preencher. A IA
              sugere e rascunha — o auditor sempre revisa e aprova antes de publicar.
            </p>
          </div>
        </section>

        <section className="border-t border-border py-16 text-center">
          <h2
            className="text-xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Veja a IA em ação no seu processo de auditoria
          </h2>
          <div className="mt-6">
            <Button render={<Link href="/login" />} nativeButton={false} size="lg">
              Comece seu teste grátis de 15 dias
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        NEXORA — Auditorias &amp; Conformidade Industrial
      </footer>
    </div>
  );
}
