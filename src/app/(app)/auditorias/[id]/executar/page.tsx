import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditExecutor } from "./executor";

export default async function ExecutarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Carrega a auditoria
  const { data: audit, error } = await supabase
    .from("audits")
    .select("id, org_id, status, started_at, auditee_name, template_id, template_version")
    .eq("id", id)
    .single();

  if (error || !audit) notFound();
  if (audit.status === "concluida" || audit.status === "cancelada") {
    redirect(`/auditorias/${id}`);
  }

  // Carrega template com seções e itens
  const { data: template } = await supabase
    .from("templates")
    .select(`
      id, title,
      template_sections (
        id, title, order_index,
        template_items (
          id, question, response_type, weight, norm_clause,
          help_text, requires_photo_on_nc, requires_action_on_nc,
          options, order_index, unit, min_value, max_value
        )
      )
    `)
    .eq("id", audit.template_id)
    .single();

  // Ordena seções e itens
  const sections = (template?.template_sections ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => ({
      ...s,
      template_items: [...(s.template_items ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    }));

  // Carrega respostas existentes (para retomada)
  const { data: answers } = await supabase
    .from("audit_answers")
    .select("id, template_item_id, response, note, photos")
    .eq("audit_id", id);

  // Carrega findings existentes
  const { data: findings } = await supabase
    .from("findings")
    .select("id, answer_id, code, severity, description")
    .eq("audit_id", id);

  return (
    <AuditExecutor
      audit={{
        id: audit.id,
        status: audit.status,
        started_at: audit.started_at,
        auditee_name: audit.auditee_name,
        template_title: template?.title ?? "",
      }}
      sections={sections}
      initialAnswers={answers ?? []}
      initialFindings={findings ?? []}
    />
  );
}
