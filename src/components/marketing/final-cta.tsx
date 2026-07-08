import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/marketing/fade-up";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="border-t border-border bg-background">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <FadeUp>
          <h2
            id="final-cta-heading"
            className="text-2xl font-bold text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sua próxima auditoria pode ser a primeira sem papel.
          </h2>
          <div className="mt-8">
            <Button render={<Link href="/login" />} nativeButton={false} size="lg">
              Começar grátis →
            </Button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
