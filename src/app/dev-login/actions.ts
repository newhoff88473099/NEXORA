"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEV_EMAIL = "dev@nexora.app";
const DEV_PASS = "Nexora@2025";

export type DevLoginState = { error?: string };

export async function autoLogin(
  _prev: DevLoginState,
  _formData: FormData
): Promise<DevLoginState> {
  if (process.env.NODE_ENV === "production") redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASS,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
