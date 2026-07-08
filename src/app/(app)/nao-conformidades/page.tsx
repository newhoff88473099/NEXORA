import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SEV_LABEL: Record<string, string> = {
  critica: "Crítica", maior: "Maior", menor: "Menor", observacao: "Observação",
};
const SEV_COLOR: Record<string, string> = {
  critica:    "text-[var(--nc)] bg-[#B3261E]/10 border-[#B3261E]/30",
  maior:      "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/30",
  menor:      "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
  observacao: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};
const SEV_ORDER = ["critica", "maior", "menor", "observacao"];

const ACTION_STATUS: Record<string, { label: string; color: string }> = {
  a_fazer:      { label: "A fazer",      color: "text-muted-foreground" },
  em_andamento: { label: "Em andamento", color: "text-[var(--info)]" },
  concluida:    { label: "Concluída",    color: "text-[var(--ok)]" },
  verificada:   { label: "Verificada",   color: "text-[var(--verified)]" },
};

type FindingRow = {
  id: string; code: string; severity: string; description: string | null;
  status: string; created_at: string;
  audits: unknown;
  actions: unknown;
};

export default async function NaoConformidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sevFilter = params.severity ?? "";

  let query = supabase
    .from("findings")
    .select(`
      id, code, severity, description, status, created_at,
      audits (
        id, started_at, auditee_name,
        templates (title)
      ),
      actions (id, status, due_date)
    `)
    .order("created_at", { ascending: false });

  if (sevFilter) query = query.eq("severity", sevFilter);

  const { data: findings } = await query;
  const rows = (findings ?? []) as FindingRow[];

  const counts = SEV_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (findings ?? []).filter((f) => f.severity === s).length;
    return acc;
  }, {});
  counts.total = (findings ?? []).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Não Conformidades
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{counts.total} NC{counts.total !== 1 ? "s" : ""} registrada{counts.total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filtros por severidade */}
      <div className="flex gap-1.5 flex-wrap">
        <Link
          href="/nao-conformidades"
          className={`text-xs px-2.5 py-1 rounded border transition-colors ${!sevFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
        >
          Todas <span className="opacity-60 font-mono">{counts.total}</span>
        </Link>
        {SEV_ORDER.map((s) => (
          <Link
            key={s}
            href={`?severity=${s}`}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              sevFilter === s ? "bg-primary text-primary-foreground border-primary" : `${SEV_COLOR[s]} hover:opacity-80`
            }`}
          >
            {SEV_LABEL[s]} <span className="font-mono opacity-70">{counts[s]}</span>
          </Link>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="rounded border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground font-mono text-xs">Código</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Severidade</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Auditoria</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((f) => {
                const auditRaw = Array.isArray(f.audits) ? f.audits[0] : f.audits;
                const audit = auditRaw as { id: string; started_at: string | null; auditee_name: string | null; templates: unknown } | null;
                const tpl = audit ? (Array.isArray(audit.templates) ? (audit.templates as unknown[])[0] : audit.templates) as { title: string } | null : null;

                const actionRaw = Array.isArray(f.actions) ? f.actions[0] : f.actions;
                const action = actionRaw as { id: string; status: string; due_date: string | null } | null;

                const isOverdue = action && action.due_date
                  && new Date(action.due_date) < new Date()
                  && action.status !== "concluida"
                  && action.status !== "verificada";

                return (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      <Link href={`/nao-conformidades/${f.id}`} className="hover:text-primary transition-colors">
                        {f.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded border ${SEV_COLOR[f.severity]}`}>
                        {SEV_LABEL[f.severity] ?? f.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-xs">
                      <p className="line-clamp-2">{f.description || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {audit ? (
                        <Link href={`/auditorias/${audit.id}`} className="text-primary hover:underline">
                          {tpl?.title ?? "—"}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                      {audit?.started_at ? new Date(audit.started_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {action ? (
                        <Link
                          href={`/acoes/${action.id}`}
                          className={`hover:underline ${ACTION_STATUS[action.status]?.color ?? ""} ${isOverdue ? "font-medium" : ""}`}
                        >
                          {ACTION_STATUS[action.status]?.label ?? action.status}
                          {isOverdue && " ⚠"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Sem ação</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="rounded border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {sevFilter ? `Nenhuma NC de severidade "${SEV_LABEL[sevFilter]}" encontrada.` : "Nenhuma NC registrada."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">NCs são registradas ao executar auditorias.</p>
        </div>
      )}
    </div>
  );
}
