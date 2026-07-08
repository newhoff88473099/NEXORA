import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, organizations(id, name)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/onboarding");
  }

  const orgRaw = membership.organizations;
  const org = (
    Array.isArray(orgRaw) ? orgRaw[0] : orgRaw
  ) as { id: string; name: string } | null;
  if (!org) redirect("/onboarding");

  const { data: plants } = await supabase
    .from("plants")
    .select("id, name")
    .eq("org_id", org.id)
    .order("name");

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col md:pl-56">
        <AppTopbar
          userEmail={user.email ?? ""}
          orgName={org.name}
          plants={plants ?? []}
        />
        <main className="flex-1 pt-14">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
