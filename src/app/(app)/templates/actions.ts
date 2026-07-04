"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Tipos ────────────────────────────────────────────────────

export type ActionResult = { error?: string };

async function getOrgId(): Promise<{ userId: string; orgId: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!data) return null;
  return { userId: user.id, orgId: data.org_id };
}

// ── Template ─────────────────────────────────────────────────

export async function createTemplate(formData: FormData): Promise<void> {
  const session = await getOrgId();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      title: formData.get("title")?.toString() || "Novo checklist",
      category: formData.get("category")?.toString() || "operacional",
      org_id: session.orgId,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error || !template) return;

  // Cria a primeira seção automaticamente
  await supabase.from("template_sections").insert({
    template_id: template.id,
    title: "Seção 1",
    order_index: 0,
  });

  redirect(`/templates/${template.id}`);
}

export async function updateTemplateMetadata(
  id: string,
  data: { title?: string; category?: string; norm_ref?: string | null }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ ...data })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function publishTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ status: "published" })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/templates");
  revalidatePath(`/templates/${id}`);
  return {};
}

export async function archiveTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/templates");
  return {};
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("status", "draft");

  if (error) return { error: error.message };
  revalidatePath("/templates");
  return {};
}

export async function duplicateTemplate(
  id: string,
  asNewVersion = false
): Promise<ActionResult> {
  const session = await getOrgId();
  if (!session) return { error: "Não autorizado" };

  const supabase = await createClient();

  // Carrega o template original com seções e itens
  const { data: original } = await supabase
    .from("templates")
    .select(`*, template_sections(*, template_items(*))`)
    .eq("id", id)
    .single();

  if (!original) return { error: "Template não encontrado" };

  const newVersion = asNewVersion ? original.version + 1 : 1;
  const newTitle = asNewVersion ? original.title : `${original.title} (cópia)`;

  const { data: copy, error: copyError } = await supabase
    .from("templates")
    .insert({
      org_id: session.orgId,
      created_by: session.userId,
      title: newTitle,
      category: original.category,
      norm_ref: original.norm_ref,
      version: newVersion,
      status: "draft",
      is_library: false,
    })
    .select("id")
    .single();

  if (copyError || !copy) return { error: copyError?.message ?? "Erro ao duplicar" };

  // Copia seções e itens
  const sections = (original.template_sections ?? []) as Array<{
    id: string; title: string; order_index: number;
    template_items: Array<{ question: string; response_type: string; weight: number; norm_clause: string | null; help_text: string | null; requires_photo_on_nc: boolean; requires_action_on_nc: boolean; unit: string | null; min_value: number | null; max_value: number | null; options: unknown; order_index: number }>;
  }>;

  for (const section of sections) {
    const { data: newSection } = await supabase
      .from("template_sections")
      .insert({ template_id: copy.id, title: section.title, order_index: section.order_index })
      .select("id")
      .single();

    if (!newSection) continue;

    const items = section.template_items ?? [];
    if (items.length > 0) {
      await supabase.from("template_items").insert(
        items.map((item) => ({
          section_id: newSection.id,
          question: item.question,
          response_type: item.response_type,
          weight: item.weight,
          norm_clause: item.norm_clause,
          help_text: item.help_text,
          requires_photo_on_nc: item.requires_photo_on_nc,
          requires_action_on_nc: item.requires_action_on_nc,
          unit: item.unit,
          min_value: item.min_value,
          max_value: item.max_value,
          options: item.options,
          order_index: item.order_index,
        }))
      );
    }
  }

  revalidatePath("/templates");
  redirect(`/templates/${copy.id}`);
}

// ── Seções ───────────────────────────────────────────────────

export async function createSection(
  templateId: string,
  title: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("template_sections")
    .select("order_index")
    .eq("template_id", templateId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (last?.order_index ?? -1) + 1;
  const { data, error } = await supabase
    .from("template_sections")
    .insert({ template_id: templateId, title, order_index: nextIndex })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateSection(
  id: string,
  title: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_sections")
    .update({ title })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteSection(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_sections")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function reorderSections(
  templateId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("template_sections").update({ order_index: index }).eq("id", id)
  );
  await Promise.all(updates);
  return {};
}

// ── Itens ────────────────────────────────────────────────────

export async function createItem(
  sectionId: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("template_items")
    .select("order_index")
    .eq("section_id", sectionId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (last?.order_index ?? -1) + 1;
  const { data, error } = await supabase
    .from("template_items")
    .insert({
      section_id: sectionId,
      question: "Nova pergunta",
      response_type: "conforme_nc_na",
      weight: 5,
      order_index: nextIndex,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateItem(
  id: string,
  data: {
    question?: string;
    response_type?: string;
    weight?: number;
    norm_clause?: string;
    help_text?: string;
    requires_photo_on_nc?: boolean;
    requires_action_on_nc?: boolean;
    unit?: string;
    min_value?: number | null;
    max_value?: number | null;
    options?: unknown;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("template_items")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("template_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function reorderItems(
  sectionId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("template_items").update({ order_index: index }).eq("id", id)
  );
  await Promise.all(updates);
  return {};
}
