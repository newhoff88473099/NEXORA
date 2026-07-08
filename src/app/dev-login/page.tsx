import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEV_EMAIL = "dev@nexora.app";
const DEV_PASS = "Nexora@2025";

async function autoLogin() {
  "use server";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASS,
  });

  if (error) throw new Error(error.message);

  redirect("/dashboard");
}

export default function DevLoginPage() {
  if (process.env.NODE_ENV === "production") redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form action={autoLogin}>
        <button
          type="submit"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          Entrar como dev@nexora.app
        </button>
      </form>
    </div>
  );
}
