import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 80) return "text-[var(--ok)]";
  if (score >= 60) return "text-[var(--warn)]";
  return "text-[var(--nc)]";
}

const SEVERITY_LABEL: Record<string, string> = {
  critica: "Crítica",
  maior: "Maior",
  menor: "Menor",
  observacao: "Observação",
};

const SEVERITY_COLOR: Record<string, string> = {
  critica: "text-[var(--nc)] bg-[#B3261E]/10 border-[#B3261E]/30",
  maior: "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/30",
  menor: "text-blue-700 bg-blue-50 border-blue-200",
  observacao: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};

export default async function AuditoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: audit, error } = await supabase
    .from("audits")
    .select(`
      id, status, score, started_at, finished_at, auditee_name,
      observations, auditee_signature_url,
      templates (title, category),
      plants (name)
    `)
    .eq("id", id)
    .single();

  if (error || !audit) notFound();

  // Redireciona direto para execução se ainda em andamento
  if (audit.status === "em_andamento") {
    redirect(`/auditorias/${id}/executar`);
  }

  const { data: findings } = await supabase
    .from("findings")
    .select("id, code, severity, description, status")
    .eq("audit_id", id)
    .order("created_at");

  const tpl = (Array.isArray(audit.templates) ? audit.templates[0] : audit.templates) as { title: string; category: string } | null;
  const plant = (Array.isArray(audit.plants) ? audit.plants[0] : audit.plants) as { name: string } | null;

  const ncBySeverity = (findings ?? []).reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/auditorias" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Auditorias
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{tpl?.title}</span>
      </div>

      {/* Cabeçalho */}
      <div className="rounded border border-border bg-card p-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {tpl?.title ?? "Auditoria"}
          </h1>
          <div className="flex gap-3 text-sm text-muted-foreground">
            {plant && <span>{plant.name}</span>}
            {audit.auditee_name && <span>· {audit.auditee_name}</span>}
            {audit.finished_at && (
              <span>· {new Date(audit.finished_at).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--ok)]">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Concluída</span>
          </div>
        </div>

        {/* Score */}
        {audit.score !== null && (
          <div className="text-right shrink-0">
            <div
              className={`text-4xl font-bold font-mono ${scoreColor(audit.score)}`}
            >
              {audit.score}%
            </div>
            <div className="text-xs text-muted-foreground">Score final</div>
          </div>
        )}
      </div>

      {/* NCs por severidade */}
      {(findings ?? []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Não Conformidades ({findings!.length})
          </h2>

          {/* Resumo */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(ncBySeverity).map(([sev, count]) => (
              <span key={sev} className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_COLOR[sev]}`}>
                {count} {SEVERITY_LABEL[sev]}
              </span>
            ))}
          </div>

          {/* Lista */}
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground font-mono text-xs">Código</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Severidade</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(findings ?? []).map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{f.code}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_COLOR[f.severity]}`}>
                        {SEVERITY_LABEL[f.severity]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Observações */}
      {audit.observations && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Observações gerais
          </h2>
          <div className="rounded border border-border bg-card p-4 text-sm text-foreground whitespace-pre-wrap">
            {audit.observations}
          </div>
        </section>
      )}

      {/* Assinatura */}
      {audit.auditee_signature_url && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Assinatura do auditado
          </h2>
          <div className="rounded border border-border bg-card p-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={audit.auditee_signature_url}
              alt="Assinatura do auditado"
              className="max-h-24 object-contain"
            />
          </div>
        </section>
      )}
    </div>
  );
}
