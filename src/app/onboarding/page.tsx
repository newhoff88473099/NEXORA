import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgForm } from "./org-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (membership) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/nexora-logo.png"
            alt="NEXORA"
            width={240}
            height={74}
            className="object-contain"
            priority
          />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Crie sua organização
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Você será registrado como proprietário e poderá convidar membros em seguida.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-6">
          <OrgForm />
        </div>
      </div>
    </div>
  );
}
