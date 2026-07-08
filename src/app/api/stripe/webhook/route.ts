import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { planForPriceId } from "@/lib/stripe/plans";
import { createAdminClient } from "@/lib/supabase/admin";

function periodEndOf(sub: Stripe.Subscription): string | null {
  const ts = sub.items.data[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function priceIdOf(sub: Stripe.Subscription): string | undefined {
  const price = sub.items.data[0]?.price;
  return typeof price === "string" ? price : price?.id;
}

async function syncSubscription(sub: Stripe.Subscription, orgIdHint?: string) {
  const admin = createAdminClient();
  const planId = planForPriceId(priceIdOf(sub));
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let orgId = orgIdHint;
  if (!orgId) {
    const { data } = await admin
      .from("subscriptions")
      .select("org_id")
      .eq("stripe_customer_id", customerId)
      .single();
    orgId = data?.org_id;
  }
  if (!orgId) return;

  await admin
    .from("subscriptions")
    .update({
      stripe_sub_id: sub.id,
      stripe_customer_id: customerId,
      plan: planId,
      status: sub.status,
      current_period_end: periodEndOf(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq("org_id", orgId);

  await admin.from("organizations").update({ plan: planId }).eq("id", orgId);
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook não configurado" }, { status: 503 });

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Assinatura ausente" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return Response.json({ error: `Assinatura inválida: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;
      if (session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(sub, orgId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub, sub.metadata?.org_id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const admin = createAdminClient();
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_sub_id", sub.id);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
