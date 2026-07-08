import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cancelAudit } from "./actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  agendada: "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/20",
  em_andamento: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
  concluida: "text-[var(--ok)] bg-[#1E6B4F]/10 border-[#1E6B4F]/20",
  cancelada: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function scoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-[var(--ok)]";
  if (score >= 60) return "text-[var(--warn)]";
  return "text-[var(--nc)]";
}

export default async function AuditoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; plant?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const plantFilter = params.plant ?? "";

  let query = supabase
    .from("audits")
    .select(`
      id, status, score, started_at, finished_at, auditee_name,
      templates (title),
      plants (name)
    `)
    .order("started_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (plantFilter) query = query.eq("plant_id", plantFilter);

  const { data: audits } = await query;

  let plantName: string | null = null;
  if (plantFilter) {
    const { data: plant } = await supabase
      .from("plants")
      .select("name")
      .eq("id", plantFilter)
      .single();
    plantName = plant?.name ?? null;
  }

  function buildHref(opts: { status?: string; plant?: string }) {
    const p = new URLSearchParams();
    if (opts.status) p.set("status", opts.status);
    if (opts.plant) p.set("plant", opts.plant);
    const qs = p.toString();
    return qs ? `?${qs}` : "/auditorias";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Auditorias
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(audits ?? []).length} auditoria{(audits ?? []).length !== 1 ? "s" : ""}
            {plantName && ` · planta: ${plantName}`}
          </p>
        </div>
        <Link
          href="/auditorias/nova"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nova auditoria
        </Link>
      </div>

      {plantFilter && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded border border-primary/40 bg-primary/5 text-primary">
            Planta: {plantName ?? plantFilter}
          </span>
          <Link href={buildHref({ status: statusFilter })} className="text-muted-foreground hover:text-foreground transition-colors">
            Remover filtro de planta ×
          </Link>
        </div>
      )}

      {/* Filtros de status */}
      <div className="flex gap-1.5 flex-wrap">
        {(["", "agendada", "em_andamento", "concluida", "cancelada"] as const).map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s, plant: plantFilter })}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s === "" ? "Todas" : STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {(audits ?? []).length > 0 ? (
        <div className="rounded border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Checklist</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Planta</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Auditado</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Score</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(audits ?? []).map((a) => {
                const tpl = (Array.isArray(a.templates) ? a.templates[0] : a.templates) as { title: string } | null;
                const plant = (Array.isArray(a.plants) ? a.plants[0] : a.plants) as { name: string } | null;
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <Link href={`/auditorias/${a.id}`} className="hover:text-primary transition-colors">
                        {tpl?.title ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{plant?.name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{a.auditee_name || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {fmtDate(a.finished_at ?? a.started_at)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm">
                      {a.score !== null ? (
                        <span className={scoreColor(a.score)}>{a.score}%</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${STATUS_COLOR[a.status]}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {a.status === "em_andamento" && (
                          <Link href={`/auditorias/${a.id}/executar`} className="text-xs text-primary hover:underline">
                            Continuar
                          </Link>
                        )}
                        {a.status === "concluida" && (
                          <Link href={`/auditorias/${a.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Ver
                          </Link>
                        )}
                        {(a.status === "em_andamento" || a.status === "agendada") && (
                          <form action={cancelAudit.bind(null, a.id) as unknown as (fd: FormData) => void}>
                            <ConfirmSubmitButton
                              confirmMessage="Cancelar esta auditoria? Essa ação não pode ser desfeita."
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Cancelar
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
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
          <p className="text-sm text-muted-foreground">Nenhuma auditoria encontrada.</p>
          <Link href="/auditorias/nova" className="mt-2 inline-block text-sm text-primary hover:underline">
            Iniciar a primeira auditoria
          </Link>
        </div>
      )}
    </div>
  );
}
