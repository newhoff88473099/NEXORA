"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { planById } from "@/lib/stripe/plans";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function requireBillingAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Apenas owner ou admin podem gerenciar a assinatura.");
  }

  return { user, orgId: membership.org_id as string };
}

export async function createCheckoutSession(planId: string): Promise<void> {
  const { user, orgId } = await requireBillingAdmin();

  const plan = planById(planId);
  if (!plan) throw new Error("Plano inválido.");

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .single();

  const stripe = getStripe();
  let customerId = sub?.stripe_customer_id as string | null | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { org_id: orgId },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("org_id", orgId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${SITE_URL}/configuracoes?success=1`,
    cancel_url: `${SITE_URL}/configuracoes?canceled=1`,
    metadata: { org_id: orgId },
  });

  if (!session.url) throw new Error("Falha ao iniciar checkout.");
  redirect(session.url);
}

export async function createPortalSession(): Promise<void> {
  const { orgId } = await requireBillingAdmin();

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .single();

  if (!sub?.stripe_customer_id) {
    throw new Error("Nenhuma assinatura encontrada para esta organização.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE_URL}/configuracoes`,
  });

  redirect(session.url);
}
