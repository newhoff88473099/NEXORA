import { redirect } from "next/navigation";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

function scoreColor(s: number) {
  if (s >= 80) return "text-[var(--ok)]";
  if (s >= 60) return "text-[var(--warn)]";
  return "text-[var(--nc)]";
}

const CAT_LABEL: Record<string, string> = {
  seguranca: "Segurança", qualidade: "Qualidade",
  operacional: "Operacional", laboratorio: "Laboratório",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // PDFs gerados
  const { data: pdfReports } = await supabase
    .from("audit_reports")
    .select(`
      id, file_name, file_size_bytes, created_at, storage_path,
      audits (id, templates (title))
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);

  const fromDate = params.from ?? defaultFrom;
  const toDate = params.to ?? defaultTo;
  const categoryFilter = params.category ?? "";
  const statusFilter = params.status ?? "concluida";

  // Auditorias com filtros
  let query = supabase
    .from("audits")
    .select(`
      id, status, score, started_at, finished_at, auditee_name, observations,
      templates (title, category),
      plants (name),
      findings (id, severity)
    `)
    .gte("started_at", `${fromDate}T00:00:00`)
    .lte("started_at", `${toDate}T23:59:59`)
    .order("started_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: audits } = await query;

  // Estatísticas do período
  const completed = (audits ?? []).filter((a) => a.status === "concluida");
  const scores = completed.filter((a) => a.score !== null).map((a) => a.score as number);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

  const allFindings = (audits ?? []).flatMap((a) =>
    (Array.isArray(a.findings) ? a.findings : [a.findings]).filter(Boolean)
  ) as { id: string; severity: string }[];

  const ncBySev = ["critica", "maior", "menor", "observacao"].reduce<Record<string, number>>((acc, s) => {
    acc[s] = allFindings.filter((f) => f.severity === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{(audits ?? []).length} auditoria{(audits ?? []).length !== 1 ? "s" : ""} no período</p>
        </div>
        <PrintButton />
      </div>

      {/* PDFs gerados */}
      {(pdfReports ?? []).length > 0 && (
        <div className="space-y-2 print:hidden">
          <h2 className="text-sm font-medium text-foreground">Relatórios PDF gerados</h2>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Auditoria</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Gerado em</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tamanho</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(pdfReports ?? []).map((r) => {
                  const auditRaw = Array.isArray(r.audits) ? r.audits[0] : r.audits;
                  const audit = auditRaw as { id: string; templates: unknown } | null;
                  const tpl = audit ? (Array.isArray(audit.templates) ? (audit.templates as { title: string }[])[0] : audit.templates) as { title: string } | null : null;
                  const kb = r.file_size_bytes ? Math.round(r.file_size_bytes / 1024) : null;
                  return (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">
                        {audit ? (
                          <Link href={`/auditorias/${audit.id}`} className="hover:text-primary transition-colors">
                            {tpl?.title ?? r.file_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{r.file_name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}{" "}
                        {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                        {kb !== null ? `${kb} KB` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {audit && (
                          <a
                            href={`/api/auditorias/${audit.id}/pdf`}
                            className="flex items-center gap-1 text-xs text-primary hover:underline justify-end"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            Baixar
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros */}
      <form className="flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">De</label>
          <input type="date" name="from" defaultValue={fromDate}
            className="h-9 px-3 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Até</label>
          <input type="date" name="to" defaultValue={toDate}
            className="h-9 px-3 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Categoria</label>
          <select name="category" defaultValue={categoryFilter}
            className="h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Todas</option>
            {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select name="status" defaultValue={statusFilter}
            className="h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Todos</option>
            <option value="concluida">Concluídas</option>
            <option value="em_andamento">Em andamento</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
        <button type="submit"
          className="h-9 px-4 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors self-end">
          Filtrar
        </button>
      </form>

      {/* Resumo imprimível */}
      <div className="hidden print:block mb-4 space-y-1">
        <h1 className="text-2xl font-bold">Relatório de Auditorias</h1>
        <p className="text-sm text-gray-500">Período: {fromDate} a {toDate}</p>
      </div>

      {/* KPIs do período */}
      {completed.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded border border-border p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Concluídas</p>
            <p className="text-2xl font-bold font-mono">{completed.length}</p>
          </div>
          <div className="rounded border border-border p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Score médio</p>
            <p className={`text-2xl font-bold font-mono ${avgScore !== null ? scoreColor(avgScore) : ""}`}>
              {avgScore !== null ? `${avgScore}%` : "—"}
            </p>
          </div>
          <div className="rounded border border-border p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">NCs críticas</p>
            <p className={`text-2xl font-bold font-mono ${ncBySev.critica > 0 ? "text-[var(--nc)]" : "text-foreground"}`}>
              {ncBySev.critica}
            </p>
          </div>
          <div className="rounded border border-border p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Total NCs</p>
            <p className="text-2xl font-bold font-mono text-foreground">{allFindings.length}</p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {(audits ?? []).length > 0 ? (
        <div className="rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Checklist</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Planta</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Auditado</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Score</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">NCs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(audits ?? []).map((a) => {
                const tpl = (Array.isArray(a.templates) ? a.templates[0] : a.templates) as { title: string; category: string } | null;
                const plant = (Array.isArray(a.plants) ? a.plants[0] : a.plants) as { name: string } | null;
                const ncList = (Array.isArray(a.findings) ? a.findings : [a.findings]).filter(Boolean) as { id: string; severity: string }[];
                const critCount = ncList.filter((f) => f.severity === "critica").length;
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors print:hover:bg-transparent">
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`/auditorias/${a.id}`} className="hover:text-primary transition-colors print:no-underline print:text-foreground">
                        {tpl?.title ?? "—"}
                      </Link>
                      {tpl?.category && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{CAT_LABEL[tpl.category] ?? tpl.category}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{plant?.name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{a.auditee_name || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">
                      {a.finished_at
                        ? new Date(a.finished_at).toLocaleDateString("pt-BR")
                        : a.started_at ? new Date(a.started_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {a.score !== null ? <span className={scoreColor(a.score)}>{a.score}%</span> : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {ncList.length > 0 ? (
                        <span>
                          {ncList.length}
                          {critCount > 0 && <span className="ml-1 text-[var(--nc)] font-medium">({critCount} crítica{critCount !== 1 ? "s" : ""})</span>}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma auditoria no período selecionado.</p>
        </div>
      )}
    </div>
  );
}
