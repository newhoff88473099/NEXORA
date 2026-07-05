import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NcDetail } from "./nc-detail";

export default async function NcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: finding } = await supabase
    .from("findings")
    .select(`
      id, code, severity, description, status, root_cause, root_cause_method,
      due_date, created_at, org_id,
      audits (
        id, started_at, auditee_name,
        templates (title),
        plants (name)
      ),
      actions (id, type, description, status, due_date, owner_id)
    `)
    .eq("id", id)
    .single();

  if (!finding) notFound();

  const auditRaw = Array.isArray(finding.audits) ? finding.audits[0] : finding.audits;
  const audit = auditRaw as {
    id: string;
    started_at: string | null;
    auditee_name: string | null;
    templates: unknown;
    plants: unknown;
  } | null;

  const tpl = audit
    ? (Array.isArray(audit.templates) ? (audit.templates as { title: string }[])[0] : audit.templates) as { title: string } | null
    : null;
  const plant = audit
    ? (Array.isArray(audit.plants) ? (audit.plants as { name: string }[])[0] : audit.plants) as { name: string } | null
    : null;

  const actions = (Array.isArray(finding.actions) ? finding.actions : [finding.actions]).filter(Boolean) as {
    id: string; type: string; description: string | null; status: string; due_date: string | null; owner_id: string | null;
  }[];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/nao-conformidades" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Não Conformidades
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{finding.code}</span>
      </div>

      <NcDetail
        finding={{
          id: finding.id,
          code: finding.code ?? "",
          severity: finding.severity,
          description: finding.description ?? "",
          status: finding.status,
          root_cause: finding.root_cause ?? "",
          root_cause_method: finding.root_cause_method ?? "5whys",
          due_date: finding.due_date ?? "",
          org_id: finding.org_id,
        }}
        audit={audit ? {
          id: audit.id,
          started_at: audit.started_at,
          auditee_name: audit.auditee_name,
          template_title: tpl?.title ?? null,
          plant_name: plant?.name ?? null,
        } : null}
        actions={actions}
      />
    </div>
  );
}
