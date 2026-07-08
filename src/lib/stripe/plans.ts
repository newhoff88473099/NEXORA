export type PlanDef = { id: string; name: string; priceId: string };

export const PLANS: PlanDef[] = [
  { id: "starter", name: "Starter", priceId: process.env.STRIPE_PRICE_STARTER ?? "" },
  { id: "pro", name: "Professional", priceId: process.env.STRIPE_PRICE_PRO ?? "" },
  { id: "enterprise", name: "Enterprise", priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "" },
].filter((p) => p.priceId);

export function planById(planId: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === planId);
}

export function planForPriceId(priceId: string | null | undefined): string {
  return PLANS.find((p) => p.priceId === priceId)?.id ?? "custom";
}
