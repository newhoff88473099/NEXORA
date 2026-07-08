"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();
  if (!data) return null;
  return { userId: user.id, orgId: data.org_id, supabase };
}

// ── Auditoria ─────────────────────────────────────────────────

export async function createAudit(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const templateId = formData.get("template_id")?.toString();
  const plantId = formData.get("plant_id")?.toString() || null;
  const auditee = formData.get("auditee_name")?.toString() || "";
  const scheduledAt = formData.get("scheduled_at")?.toString() || null;

  if (!templateId) return;

  // busca a versão publicada do template
  const { data: tpl } = await session.supabase
    .from("templates")
    .select("version")
    .eq("id", templateId)
    .single();

  const { data: audit, error } = await session.supabase
    .from("audits")
    .insert({
      org_id: session.orgId,
      auditor_id: session.userId,
      template_id: templateId,
      template_version: tpl?.version ?? 1,
      plant_id: plantId,
      auditee_name: auditee,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      started_at: new Date().toISOString(),
      status: "em_andamento",
    })
    .select("id")
    .single();

  if (error || !audit) return;
  redirect(`/auditorias/${audit.id}/executar`);
}

export async function cancelAudit(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado" };

  const { error } = await session.supabase
    .from("audits")
    .update({ status: "cancelada" })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/auditorias");
  return {};
}

export async function finishAudit(
  id: string,
  data: { observations?: string; score?: number; auditee_signature_url?: string }
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado" };

  const { error } = await session.supabase
    .from("audits")
    .update({
      status: "concluida",
      finished_at: new Date().toISOString(),
      observations: data.observations,
      score: data.score,
      auditee_signature_url: data.auditee_signature_url,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/auditorias");
  revalidatePath(`/auditorias/${id}`);
  redirect(`/auditorias/${id}`);
}

// ── Respostas ─────────────────────────────────────────────────

export async function saveAnswer(
  auditId: string,
  itemId: string,
  data: { response?: string; note?: string; photos?: string[] }
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    audit_id: auditId,
    template_item_id: itemId,
    answered_at: new Date().toISOString(),
  };
  if (data.response !== undefined) payload.response = data.response;
  if (data.note !== undefined) payload.note = data.note;
  if (data.photos !== undefined) payload.photos = data.photos;

  const { data: ans, error } = await supabase
    .from("audit_answers")
    .upsert(payload, { onConflict: "audit_id,template_item_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: ans.id };
}

// ── Findings (NCs) ────────────────────────────────────────────

export async function createFinding(
  auditId: string,
  itemId: string,
  data: {
    severity: string;
    description: string;
    norm_clause?: string;
    due_date?: string;
    action?: {
      type: string;
      description: string;
      due_date?: string;
    };
  }
): Promise<{ id?: string; code?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autorizado" };

  // garante que a resposta existe antes de criar o finding
  const { data: ans } = await session.supabase
    .from("audit_answers")
    .select("id")
    .eq("audit_id", auditId)
    .eq("template_item_id", itemId)
    .single();

  const { data: finding, error } = await session.supabase
    .from("findings")
    .insert({
      org_id: session.orgId,
      audit_id: auditId,
      answer_id: ans?.id ?? null,
      severity: data.severity,
      description: data.description,
      norm_clause: data.norm_clause ?? null,
      due_date: data.due_date ?? null,
    })
    .select("id, code")
    .single();

  if (error || !finding) return { error: error?.message ?? "Erro ao criar NC" };

  if (data.action) {
    await session.supabase.from("actions").insert({
      org_id: session.orgId,
      finding_id: finding.id,
      type: data.action.type,
      description: data.action.description,
      owner_id: session.userId,
      due_date: data.action.due_date ?? null,
    });
  }

  return { id: finding.id, code: finding.code };
}
