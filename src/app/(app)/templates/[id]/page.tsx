import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./editor";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: template, error } = await supabase
    .from("templates")
    .select(`
      id, org_id, title, category, norm_ref, version, status, is_library, updated_at,
      template_sections (
        id, title, order_index,
        template_items (
          id, question, response_type, weight, norm_clause, help_text,
          requires_photo_on_nc, requires_action_on_nc,
          unit, min_value, max_value, options, order_index
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !template) notFound();

  // Ordena seções e itens por order_index
  const sorted = {
    ...template,
    template_sections: (template.template_sections ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => ({
        ...s,
        template_items: (s.template_items ?? []).sort(
          (a, b) => a.order_index - b.order_index
        ),
      })),
  };

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  const canEdit =
    !template.is_library &&
    template.status === "draft" &&
    (template as { org_id?: string | null }).org_id === membership?.org_id;

  return <TemplateEditor template={sorted as Parameters<typeof TemplateEditor>[0]["template"]} canEdit={canEdit} />;
}
