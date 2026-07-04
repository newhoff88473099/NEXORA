"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthFormState = {
  error?: string;
  success?: boolean;
  email?: string;
};

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada." };
    }
    return { error: "E-mail ou senha incorretos" };
  }

  redirect("/dashboard");
}

const signUpSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const admin = createAdminClient();

  // Verifica se já existe usuário com este e-mail
  const { data: existing } = await admin.auth.admin.listUsers();
  const alreadyExists = existing?.users?.some(
    (u) => u.email === parsed.data.email
  );
  if (alreadyExists) {
    return { error: "Este e-mail já está cadastrado. Use a aba Entrar." };
  }

  // Cria com email_confirm: true para não exigir confirmação por e-mail
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (error) {
    return { error: error.message };
  }

  // Faz login imediato após o cadastro
  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (loginError) {
    return { success: true, email: parsed.data.email };
  }

  redirect("/onboarding");
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email")?.toString() ?? "";

  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { error: "Erro ao enviar e-mail. Tente novamente." };
  }

  return { success: true, email };
}

export async function sendMagicLink(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email")?.toString() ?? "";

  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Erro ao enviar link. Tente novamente." };
  }

  return { success: true, email };
}
