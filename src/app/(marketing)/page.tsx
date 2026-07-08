import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingHeader } from "@/components/marketing/header";
import { Hero } from "@/components/marketing/hero";
import { HazardDivider } from "@/components/marketing/hazard-divider";
import { ProofBar } from "@/components/marketing/proof-bar";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { StepsGrid } from "@/components/marketing/steps-grid";
import { AISection } from "@/components/marketing/ai-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Pricing } from "@/components/marketing/pricing";
import { FinalCta } from "@/components/marketing/final-cta";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "NEXORA — Gestão de auditorias e inspeções industriais",
  description:
    "Planeje, execute e acompanhe auditorias, não conformidades e planos de ação em um só lugar. Sem planilha, sem papel perdido, com rastreabilidade completa.",
  openGraph: {
    title: "NEXORA — Gestão de auditorias e inspeções industriais",
    description:
      "Planeje, execute e acompanhe auditorias, não conformidades e planos de ação em um só lugar.",
    images: ["/nexora-logo.png"],
  },
};

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <HazardDivider />
        <ProofBar />
        <ProblemSolution />
        <StepsGrid />
        <AISection />
        <FeatureGrid />
        <Pricing />
        <FinalCta />
        <HazardDivider />
      </main>
      <MarketingFooter />
    </div>
  );
}
