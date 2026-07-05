import { type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditPDF } from "@/components/pdf/audit-pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { data: audit } = await supabase
    .from("audits")
    .select(`
      id, status, score, finished_at, auditee_name, observations, auditee_signature_url,
      templates (title),
      plants (name)
    `)
    .eq("id", id)
    .single();

  if (!audit || audit.status !== "concluida") {
    return Response.json({ error: "Auditoria não encontrada ou não concluída" }, { status: 404 });
  }

  const { data: findings } = await supabase
    .from("findings")
    .select("code, severity, description")
    .eq("audit_id", id)
    .order("created_at");

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  const admin = createAdminClient();
  const { data: auditorData } = await admin.auth.admin.getUserById(user.id);
  const auditorEmail = auditorData?.user?.email ?? null;

  const tpl   = (Array.isArray(audit.templates) ? audit.templates[0] : audit.templates) as { title: string } | null;
  const plant  = (Array.isArray(audit.plants)    ? audit.plants[0]    : audit.plants)    as { name: string } | null;

  const pdfData = {
    audit: {
      id: audit.id,
      template_title: tpl?.title ?? "Auditoria",
      plant_name: plant?.name ?? null,
      auditee_name: audit.auditee_name,
      auditor_email: auditorEmail,
      finished_at: audit.finished_at,
      score: typeof audit.score === "number" ? audit.score : null,
      observations: audit.observations,
      auditee_signature_url: audit.auditee_signature_url,
    },
    findings: (findings ?? []).map((f) => ({
      code: f.code ?? "",
      severity: f.severity,
      description: f.description,
    })),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(<AuditPDF {...pdfData} /> as any);

  const timestamp = Date.now();
  const shortId   = audit.id.slice(0, 8);
  const fileName  = `auditoria-${shortId}-${timestamp}.pdf`;
  const storagePath = `${audit.id}/${fileName}`;

  // Salva no Storage (non-fatal)
  const { error: uploadErr } = await supabase.storage
    .from("audit-reports")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

  if (!uploadErr && membership?.org_id) {
    void supabase.from("audit_reports").insert({
      org_id: membership.org_id,
      audit_id: audit.id,
      storage_path: storagePath,
      file_name: fileName,
      file_size_bytes: buffer.length,
      generated_by: user.id,
    });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
