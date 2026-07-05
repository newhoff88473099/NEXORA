import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getOrgId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userId)
    .single();
  return membership?.org_id ?? null;
}

async function isTrialExpired(orgId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("status, trial_ends_at")
    .eq("org_id", orgId)
    .single();
  if (!subscription) return false;

  return (
    subscription.status === "trialing" &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) < new Date()
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dev-login") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname === "/";

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const isOnboardingGateExempt = isPublicPath || pathname.startsWith("/onboarding");

  if (user && !isOnboardingGateExempt) {
    const orgId = await getOrgId(user.id);

    if (!orgId) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    const isTrialGateExempt = pathname.startsWith("/configuracoes");
    if (!isTrialGateExempt && (await isTrialExpired(orgId))) {
      const url = request.nextUrl.clone();
      url.pathname = "/configuracoes";
      url.search = "?trial_expired=1";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
