import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/stripe/plans";
import { createCheckoutSession, createPortalSession } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Período de teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  unpaid: "Não paga",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trialing: "secondary",
  active: "default",
  past_due: "destructive",
  canceled: "outline",
  incomplete: "destructive",
  incomplete_expired: "outline",
  unpaid: "destructive",
};

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; trial_expired?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/onboarding");

  const isBillingAdmin = ["owner", "admin"].includes(membership.role);

  const { data: org } = await supabase
    .from("organizations")
    .select("name, cnpj, plan")
    .eq("id", membership.org_id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end, stripe_customer_id, trial_ends_at")
    .eq("org_id", membership.org_id)
    .single();

  const params = await searchParams;

  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const isTrialing = subscription?.status === "trialing";
  const trialExpired = isTrialing && !!trialEndsAt && trialEndsAt < new Date();
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{org?.name}</p>
      </div>

      {params.success === "1" && (
        <div className="rounded border border-[var(--ok)]/30 bg-[var(--ok)]/10 px-4 py-3 text-sm text-[var(--ok)]">
          Assinatura confirmada com sucesso.
        </div>
      )}
      {params.canceled === "1" && (
        <div className="rounded border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelado — nenhuma cobrança foi feita.
        </div>
      )}
      {(params.trial_expired === "1" || trialExpired) && (
        <div className="rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Seu período de teste terminou. Assine um plano abaixo para continuar usando o NEXORA.
        </div>
      )}

      <div className="rounded border border-border p-5 space-y-4">
        <h2 className="text-sm font-medium text-foreground">Assinatura</h2>

        {!isBillingAdmin ? (
          <p className="text-sm text-muted-foreground">
            Plano atual: <span className="font-medium text-foreground">{org?.plan ?? "trial"}</span>.
            Fale com um administrador da organização para gerenciar a assinatura.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANT[subscription?.status ?? "trialing"] ?? "outline"}>
                {STATUS_LABEL[subscription?.status ?? "trialing"] ?? subscription?.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Plano: <span className="font-medium text-foreground">{subscription?.plan ?? "trial"}</span>
              </span>
            </div>

            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end ? "Acesso até" : "Renova em"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                {subscription.cancel_at_period_end && " — assinatura será cancelada nessa data"}
              </p>
            )}

            {isTrialing && trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                {trialExpired
                  ? `Teste expirado em ${trialEndsAt.toLocaleDateString("pt-BR")}`
                  : `Teste expira em ${trialEndsAt.toLocaleDateString("pt-BR")} (${trialDaysLeft} ${trialDaysLeft === 1 ? "dia" : "dias"})`}
              </p>
            )}

            {subscription?.stripe_customer_id ? (
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="h-9 px-4 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Gerenciar assinatura
                </button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa ainda.</p>
            )}

            {PLANS.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Planos disponíveis</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PLANS.map((plan) => (
                    <form key={plan.id} action={createCheckoutSession.bind(null, plan.id)}>
                      <button
                        type="submit"
                        className="w-full h-9 px-4 rounded border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        Assinar {plan.name}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
