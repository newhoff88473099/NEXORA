import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoreTrend } from "@/components/dashboard/score-trend";
import { SeverityBars } from "@/components/dashboard/severity-bars";

function scoreColor(s: number) {
  if (s >= 80) return "text-[var(--ok)]";
  if (s >= 60) return "text-[var(--warn)]";
  return "text-[var(--nc)]";
}

const STATUS_COLOR: Record<string, string> = {
  agendada:     "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/20",
  em_andamento: "text-blue-700 bg-blue-50 border-blue-200",
  concluida:    "text-[var(--ok)] bg-[#1E6B4F]/10 border-[#1E6B4F]/20",
  cancelada:    "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};
const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const since56 = new Date(now.getTime() - 56 * 86400 * 1000).toISOString();

  const [
    { data: auditsMonth },
    { data: allCompleted },
    { data: findings },
    { data: overdueActions },
    { data: recentAudits },
    { data: trendAudits },
  ] = await Promise.all([
    supabase.from("audits").select("id").gte("started_at", startOfMonth).neq("status", "cancelada"),
    supabase.from("audits").select("id, score").eq("status", "concluida"),
    supabase.from("findings").select("id, severity"),
    supabase.from("actions").select("id")
      .lt("due_date", now.toISOString().slice(0, 10))
      .not("status", "in", '("concluida","verificada")'),
    supabase.from("audits")
      .select(`id, status, score, started_at, finished_at, auditee_name, templates (title)`)
      .neq("status", "cancelada")
      .order("started_at", { ascending: false })
      .limit(6),
    supabase.from("audits")
      .select("id, score, finished_at")
      .eq("status", "concluida")
      .gte("finished_at", since56)
      .order("finished_at"),
  ]);

  // KPIs
  const thisMonthCount = (auditsMonth ?? []).length;
  const scores = (allCompleted ?? []).filter((a) => a.score !== null).map((a) => a.score as number);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const openNcs = (findings ?? []).length;
  const overdueCount = (overdueActions ?? []).length;

  // Tendência 8 semanas
  const since56Date = new Date(since56);
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const wStart = new Date(since56Date.getTime() + i * 7 * 86400 * 1000);
    const wEnd = new Date(wStart.getTime() + 7 * 86400 * 1000);
    const wAudits = (trendAudits ?? []).filter((a) => {
      const d = new Date(a.finished_at ?? "");
      return d >= wStart && d < wEnd && a.score !== null;
    });
    return {
      week: `S${i + 1}`,
      score: wAudits.length > 0
        ? Math.round(wAudits.reduce((s, a) => s + (a.score ?? 0), 0) / wAudits.length)
        : null,
      count: wAudits.length,
    };
  });

  // NCs por severidade
  const SEV_ORDER = ["critica", "maior", "menor", "observacao"];
  const ncBySev = SEV_ORDER.map((sev) => ({
    severity: sev,
    count: (findings ?? []).filter((f) => f.severity === sev).length,
  })).filter((d) => d.count > 0);

  type AuditRow = {
    id: string; status: string; score: number | null;
    started_at: string | null; finished_at: string | null;
    auditee_name: string | null; templates: unknown;
  };
  const recent = (recentAudits ?? []) as AuditRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Este mês</p>
          <p className="text-3xl font-bold font-mono text-foreground">{thisMonthCount}</p>
          <p className="text-xs text-muted-foreground">auditoria{thisMonthCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Score médio</p>
          <p className={`text-3xl font-bold font-mono ${avgScore !== null ? scoreColor(avgScore) : "text-muted-foreground"}`}>
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{scores.length} concluída{scores.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">NCs abertas</p>
          <p className={`text-3xl font-bold font-mono ${openNcs > 0 ? "text-[var(--nc)]" : "text-foreground"}`}>
            {openNcs}
          </p>
          <p className="text-xs text-muted-foreground">não conformidade{openNcs !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ações vencidas</p>
          <p className={`text-3xl font-bold font-mono ${overdueCount > 0 ? "text-[var(--warn)]" : "text-foreground"}`}>
            {overdueCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {overdueCount > 0 ? (
              <Link href="/acoes?overdue=1" className="text-[var(--warn)] hover:underline">Ver ações →</Link>
            ) : "em dia"}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Tendência de Score</p>
            <p className="text-xs text-muted-foreground">Últimas 8 semanas · auditorias concluídas</p>
          </div>
          {weeklyData.some((d) => d.score !== null) ? (
            <ScoreTrend data={weeklyData} />
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              Sem auditorias concluídas nas últimas 8 semanas
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded border border-border bg-card p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">NCs por Severidade</p>
            <p className="text-xs text-muted-foreground">{openNcs} total</p>
          </div>
          {ncBySev.length > 0 ? (
            <SeverityBars data={ncBySev} />
          ) : (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
              Nenhuma NC registrada
            </div>
          )}
        </div>
      </div>

      {/* Últimas auditorias */}
      <div className="rounded border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Últimas Auditorias</p>
          <Link href="/auditorias" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </div>
        {recent.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Checklist</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Auditado</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Data</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-20">Score</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((a) => {
                const tpl = (Array.isArray(a.templates) ? a.templates[0] : a.templates) as { title: string } | null;
                const date = a.finished_at ?? a.started_at;
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">
                      <Link href={`/auditorias/${a.id}`} className="hover:text-primary transition-colors">
                        {tpl?.title ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{a.auditee_name || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {date ? new Date(date).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {a.score !== null ? <span className={scoreColor(a.score)}>{a.score}%</span> : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${STATUS_COLOR[a.status]}`}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma auditoria ainda.{" "}
            <Link href="/auditorias/nova" className="text-primary hover:underline">Iniciar a primeira →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
