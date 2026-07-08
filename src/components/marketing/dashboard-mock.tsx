import { ScoreTrend } from "@/components/dashboard/score-trend";
import { SeverityBars } from "@/components/dashboard/severity-bars";

const KPIS = [
  { label: "Este mês", value: "12", hint: "auditorias" },
  { label: "Score médio", value: "88%", hint: "23 concluídas", tone: "text-[var(--ok)]" },
  { label: "NCs abertas", value: "20", hint: "não conformidades", tone: "text-[var(--nc)]" },
  { label: "Ações vencidas", value: "3", hint: "em atraso", tone: "text-[var(--warn)]" },
];

const SCORE_TREND = [
  { week: "S1", score: 72, count: 3 },
  { week: "S2", score: 75, count: 2 },
  { week: "S3", score: 78, count: 4 },
  { week: "S4", score: 74, count: 3 },
  { week: "S5", score: 81, count: 5 },
  { week: "S6", score: 85, count: 3 },
  { week: "S7", score: 88, count: 4 },
  { week: "S8", score: 91, count: 3 },
];

const SEVERITY = [
  { severity: "critica", count: 2 },
  { severity: "maior", count: 5 },
  { severity: "menor", count: 9 },
  { severity: "observacao", count: 4 },
];

export function DashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-md border border-border bg-card"
    >
      <div className="overflow-x-auto p-4 sm:p-5">
        <div className="min-w-[560px] space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="rounded border border-border bg-background p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className={`font-mono text-2xl font-bold text-foreground ${kpi.tone ?? ""}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-2 rounded border border-border bg-background p-3">
              <p className="text-xs font-medium text-foreground">Tendência de Score</p>
              <ScoreTrend data={SCORE_TREND} />
            </div>
            <div className="col-span-2 space-y-2 rounded border border-border bg-background p-3">
              <p className="text-xs font-medium text-foreground">NCs por Severidade</p>
              <SeverityBars data={SEVERITY} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full" style={{ background: "var(--hazard-stripe)" }} />
    </div>
  );
}
