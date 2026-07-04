"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const orgSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(120, "Nome muito longo"),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (use XX.XXX.XXX/XXXX-XX)"),
});

export type OrgFormState = {
  errors?: { name?: string[]; cnpj?: string[]; _form?: string[] };
};

export async function createOrganization(
  _prev: OrgFormState,
  formData: FormData
): Promise<OrgFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { errors: { _form: ["Não autorizado"] } };

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Usa admin client para bypass de RLS no insert inicial
  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: parsed.data.name, cnpj: parsed.data.cnpj })
    .select("id")
    .single();

  if (orgError || !org) {
    return { errors: { _form: ["Erro ao criar organização. Tente novamente."] } };
  }

  const { error: memberError } = await admin.from("memberships").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { errors: { _form: ["Organização criada mas falha ao associar usuário."] } };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
