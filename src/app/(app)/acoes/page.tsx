import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS: Record<string, { label: string; color: string }> = {
  a_fazer:      { label: "A fazer",       color: "text-muted-foreground bg-muted border-border" },
  em_andamento: { label: "Em andamento",  color: "text-blue-700 bg-blue-50 border-blue-200" },
  concluida:    { label: "Concluída",     color: "text-[var(--ok)] bg-[#1E6B4F]/10 border-[#1E6B4F]/20" },
  verificada:   { label: "Verificada",    color: "text-purple-700 bg-purple-50 border-purple-200" },
};

const TYPE: Record<string, string> = {
  corretiva:  "Corretiva",
  preventiva: "Preventiva",
  contencao:  "Contenção",
};

const SEV_COLOR: Record<string, string> = {
  critica:   "text-[var(--nc)] bg-[#B3261E]/10 border-[#B3261E]/30",
  maior:     "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/30",
  menor:     "text-blue-700 bg-blue-50 border-blue-200",
  observacao:"text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function isOverdue(due_date: string | null, status: string) {
  if (!due_date || status === "concluida" || status === "verificada") return false;
  return new Date(due_date) < new Date();
}

type RawAction = {
  id: string;
  type: string;
  description: string | null;
  status: string;
  due_date: string | null;
  owner_id: string | null;
  created_at: string;
  findings: unknown;
};

function extractFinding(findings: unknown) {
  const f = (Array.isArray(findings) ? findings[0] : findings) as {
    id: string; code: string; severity: string;
    audits: unknown;
  } | null;
  if (!f) return { code: "—", severity: "—", auditTitle: "—", auditId: null };

  const a = (Array.isArray(f.audits) ? (f.audits as unknown[])[0] : f.audits) as {
    id: string;
    templates: unknown;
  } | null;

  const tpl = (Array.isArray(a?.templates) ? (a!.templates as unknown[])[0] : a?.templates) as { title: string } | null;

  return {
    code: f.code,
    severity: f.severity,
    auditTitle: tpl?.title ?? "—",
    auditId: a?.id ?? null,
  };
}

export default async function AcoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; overdue?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const overdueOnly = params.overdue === "1";

  let query = supabase
    .from("actions")
    .select(`
      id, type, description, status, due_date, owner_id, created_at,
      findings (
        id, code, severity,
        audits (
          id,
          templates (title)
        )
      )
    `)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: raw } = await query;
  const actions = (raw ?? []) as RawAction[];

  const today = new Date().toDateString();
  const filtered = overdueOnly
    ? actions.filter((a) => isOverdue(a.due_date, a.status))
    : actions;

  const counts = {
    total: actions.length,
    a_fazer: actions.filter((a) => a.status === "a_fazer").length,
    em_andamento: actions.filter((a) => a.status === "em_andamento").length,
    concluida: actions.filter((a) => a.status === "concluida").length,
    verificada: actions.filter((a) => a.status === "verificada").length,
    overdue: actions.filter((a) => isOverdue(a.due_date, a.status)).length,
  };

  void today;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Plano de Ação
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} ação{filtered.length !== 1 ? "ões" : ""}
            {counts.overdue > 0 && (
              <span className="ml-2 text-[var(--nc)]">· {counts.overdue} vencida{counts.overdue !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          ["", "Todas", counts.total],
          ["a_fazer", "A fazer", counts.a_fazer],
          ["em_andamento", "Em andamento", counts.em_andamento],
          ["concluida", "Concluídas", counts.concluida],
          ["verificada", "Verificadas", counts.verificada],
        ] as [string, string, number][]).map(([s, label, count]) => (
          <Link
            key={s}
            href={s ? `?status=${s}` : "/acoes"}
            className={`text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              statusFilter === s && !overdueOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {label}
            <span className="opacity-60 font-mono">{count}</span>
          </Link>
        ))}
        {counts.overdue > 0 && (
          <Link
            href="?overdue=1"
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              overdueOnly
                ? "bg-[var(--nc)] text-white border-[var(--nc)]"
                : "border-[var(--nc)]/40 text-[var(--nc)] hover:border-[var(--nc)]"
            }`}
          >
            Vencidas {counts.overdue}
          </Link>
        )}
      </div>

      {/* Tabela */}
      {filtered.length > 0 ? (
        <div className="rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground font-mono text-xs">NC</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Checklist</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Prazo</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const { code, severity, auditTitle, auditId } = extractFinding(a.findings);
                const overdue = isOverdue(a.due_date, a.status);

                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/acoes/${a.id}`}
                          className="font-mono text-xs text-foreground hover:text-primary transition-colors"
                        >
                          {code}
                        </Link>
                        {severity !== "—" && (
                          <span className={`inline-flex w-fit text-[10px] px-1.5 py-0 rounded border ${SEV_COLOR[severity]}`}>
                            {severity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {auditId ? (
                        <Link href={`/auditorias/${auditId}`} className="hover:text-foreground transition-colors">
                          {auditTitle}
                        </Link>
                      ) : auditTitle}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {TYPE[a.type] ?? a.type}
                    </td>
                    <td className="px-3 py-2.5 text-foreground max-w-xs">
                      <Link href={`/acoes/${a.id}`} className="hover:text-primary transition-colors line-clamp-2">
                        {a.description || <span className="text-muted-foreground italic">Sem descrição</span>}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono">
                      <span className={overdue ? "text-[var(--nc)] font-medium" : "text-muted-foreground"}>
                        {fmtDate(a.due_date)}
                        {overdue && " ⚠"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${STATUS[a.status]?.color ?? ""}`}>
                        {STATUS[a.status]?.label ?? a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {statusFilter || overdueOnly ? "Nenhuma ação encontrada com esse filtro." : "Nenhuma ação cadastrada."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ações são criadas ao registrar uma NC durante a execução de uma auditoria.
          </p>
        </div>
      )}
    </div>
  );
}
