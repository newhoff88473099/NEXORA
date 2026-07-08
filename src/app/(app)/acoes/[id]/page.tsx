import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionDetail } from "./action-detail";

export default async function AcaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: action, error } = await supabase
    .from("actions")
    .select(`
      id, type, description, status, due_date, owner_id,
      evidence_photos, created_at, verified_at, verified_by,
      findings (
        id, code, severity, description, root_cause, status,
        audit_id,
        audit_answers ( note, photos ),
        audits (
          id, auditee_name, started_at,
          templates (title, category)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !action) notFound();

  // Membros da org para o dropdown de responsável
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role");

  const adminClient = createAdminClient();
  const members = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { data: { user: u } } = await adminClient.auth.admin.getUserById(m.user_id);
      return {
        id: m.user_id,
        email: u?.email ?? m.user_id,
        name: (u?.user_metadata as Record<string, string> | undefined)?.name ?? u?.email ?? m.user_id,
        role: m.role,
      };
    })
  );

  // Normaliza finding
  const findingRaw = Array.isArray(action.findings) ? action.findings[0] : action.findings;
  const finding = findingRaw as {
    id: string; code: string; severity: string; description: string | null;
    root_cause: string | null; status: string; audit_id: string;
    audit_answers: unknown;
    audits: unknown;
  } | null;

  const auditRaw = finding ? (Array.isArray(finding.audits) ? (finding.audits as unknown[])[0] : finding.audits) : null;
  const audit = auditRaw as {
    id: string; auditee_name: string | null; started_at: string | null;
    templates: unknown;
  } | null;

  const tplRaw = audit ? (Array.isArray(audit.templates) ? (audit.templates as unknown[])[0] : audit.templates) : null;
  const template = tplRaw as { title: string; category: string } | null;

  return (
    <ActionDetail
      action={{
        id: action.id,
        type: action.type,
        description: action.description,
        status: action.status,
        due_date: action.due_date,
        owner_id: action.owner_id,
        evidence_photos: Array.isArray(action.evidence_photos) ? (action.evidence_photos as string[]) : [],
        created_at: action.created_at,
      }}
      finding={finding ? {
        id: finding.id,
        code: finding.code,
        severity: finding.severity,
        description: finding.description,
        root_cause: finding.root_cause,
      } : null}
      audit={audit ? {
        id: audit.id,
        auditee_name: audit.auditee_name,
        started_at: audit.started_at,
        template_title: template?.title ?? "—",
      } : null}
      members={members}
      currentUserId={user.id}
    />
  );
}
