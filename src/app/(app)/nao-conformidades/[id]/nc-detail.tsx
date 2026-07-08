"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Save, ExternalLink, Plus } from "lucide-react";
import {
  updateFindingDescription,
  updateFindingRootCause,
  updateFindingStatus,
  createActionFromFinding,
} from "./actions";

const SEV_COLOR: Record<string, string> = {
  critica:    "text-[var(--nc)] bg-[#B3261E]/10 border-[#B3261E]/30",
  maior:      "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/30",
  menor:      "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
  observacao: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};
const SEV_LABEL: Record<string, string> = {
  critica: "Crítica", maior: "Maior", menor: "Menor", observacao: "Observação",
};
const STATUS_STEPS = [
  { value: "aberta",       label: "Aberta" },
  { value: "em_analise",   label: "Em análise" },
  { value: "em_execucao",  label: "Em execução" },
  { value: "verificacao",  label: "Verificação" },
  { value: "encerrada",    label: "Encerrada" },
];
const ACTION_TYPE_LABEL: Record<string, string> = {
  contencao: "Contenção",
  corretiva: "Corretiva",
  preventiva: "Preventiva",
};
const ACTION_STATUS_LABEL: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  verificada: "Verificada",
};

type Finding = {
  id: string; code: string; severity: string; description: string; status: string;
  root_cause: string; root_cause_method: string; due_date: string; org_id: string;
};
type AuditInfo = {
  id: string; started_at: string | null; auditee_name: string | null;
  template_title: string | null; plant_name: string | null;
} | null;
type ActionRow = {
  id: string; type: string; description: string | null; status: string;
  due_date: string | null; owner_id: string | null;
};
type SuggestedAnalysis = {
  porques: string[];
  acoes: Array<{ tipo: string; descricao: string }>;
};

export function NcDetail({ finding: initial, audit, actions: initialActions }: {
  finding: Finding;
  audit: AuditInfo;
  actions: ActionRow[];
}) {
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [porques, setPorques] = useState<string[]>(() => {
    if (initial.root_cause) {
      try {
        const parsed = JSON.parse(initial.root_cause) as { porques?: string[] };
        if (Array.isArray(parsed.porques)) return parsed.porques;
      } catch { /* ignore */ }
    }
    return ["", "", "", "", ""];
  });
  const [actions, setActions] = useState(initialActions);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [creatingAction, setCreatingAction] = useState<string | null>(null);
  const descTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleDescChange(v: string) {
    setDescription(v);
    setAiUsed(false);
    clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      void updateFindingDescription(initial.id, v);
    }, 1200);
  }

  async function handleStatusChange(s: string) {
    setSavingStatus(true);
    setStatus(s);
    await updateFindingStatus(initial.id, s);
    setSavingStatus(false);
  }

  async function handleSuggestAnalysis() {
    setAiLoading(true);
    setSuggested(null);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          feature: "suggest_analysis",
          payload: { description: initial.description, severity: initial.severity },
        }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (data.text) {
        const parsed = JSON.parse(data.text) as SuggestedAnalysis;
        setPorques(parsed.porques ?? ["", "", "", "", ""]);
        setSuggested(parsed);
        setAiUsed(true);
      } else {
        toast.error(data.error || "Não foi possível gerar a análise. Tente novamente.");
      }
    } catch {
      toast.error("Não foi possível contatar o assistente de IA. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSaveRootCause() {
    setSaving(true);
    await updateFindingRootCause(initial.id, {
      root_cause_method: "5whys",
      root_cause: JSON.stringify({ porques }),
    });
    setSaving(false);
    setAiUsed(false);
  }

  async function handleCreateAction(tipo: string, descricao: string) {
    setCreatingAction(tipo);
    const result = await createActionFromFinding(initial.id, initial.org_id, { type: tipo, description: descricao });
    if (result.id) {
      setActions((prev) => [...prev, {
        id: result.id!,
        type: tipo,
        description: descricao,
        status: "a_fazer",
        due_date: null,
        owner_id: null,
      }]);
    }
    setCreatingAction(null);
  }

  const currentStatusIdx = STATUS_STEPS.findIndex((s) => s.value === status);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{initial.code}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${SEV_COLOR[initial.severity]}`}>
                {SEV_LABEL[initial.severity]}
              </span>
            </div>
            {audit && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                Auditoria:
                <Link href={`/auditorias/${audit.id}`} className="text-primary hover:underline flex items-center gap-0.5">
                  {audit.template_title ?? "—"}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                {audit.plant_name && <span>· {audit.plant_name}</span>}
                {audit.started_at && (
                  <span>· {new Date(audit.started_at).toLocaleDateString("pt-BR")}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stepper de status */}
        <div className="flex items-center gap-0 mt-2">
          {STATUS_STEPS.map((step, idx) => {
            const isActive = idx === currentStatusIdx;
            const isDone = idx < currentStatusIdx;
            return (
              <button
                key={step.value}
                onClick={() => void handleStatusChange(step.value)}
                disabled={savingStatus}
                className={`flex-1 py-1.5 text-[11px] border-b-2 transition-colors text-center ${
                  isActive
                    ? "border-primary text-foreground font-medium"
                    : isDone
                    ? "border-[var(--ok)] text-[var(--ok)]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Descrição */}
      <div className="rounded border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Descrição da NC</h3>
        </div>
        <textarea
          value={description}
          onChange={(e) => handleDescChange(e.target.value)}
          rows={3}
          placeholder="Descrição da não conformidade…"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Análise de causa raiz — 5 Porquês */}
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Causa Raiz — 5 Porquês</h3>
          <button
            type="button"
            onClick={handleSuggestAnalysis}
            disabled={aiLoading || !initial.description}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiLoading ? "Analisando…" : "Sugerir análise"}
          </button>
        </div>

        <div className="space-y-2">
          {porques.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs font-mono text-muted-foreground pt-2 w-5 shrink-0">{i + 1}°</span>
              <textarea
                value={p}
                onChange={(e) => {
                  const next = [...porques];
                  next[i] = e.target.value;
                  setPorques(next);
                  setAiUsed(false);
                }}
                rows={2}
                placeholder={`${i === 0 ? "Por que ocorreu a NC?" : `Por que "${porques[i - 1] || "…"}"?`}`}
                className="flex-1 px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {aiUsed && (
          <p className="text-[10px] text-muted-foreground">
            Rascunho gerado automaticamente — revise antes de salvar.
          </p>
        )}

        <button
          onClick={handleSaveRootCause}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Salvando…" : "Salvar análise"}
        </button>

        {/* Ações sugeridas pela IA */}
        {suggested?.acoes && suggested.acoes.length > 0 && (
          <div className="border-t border-border/60 pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Ações sugeridas</p>
            {suggested.acoes.map((a) => (
              <div key={a.tipo} className="flex items-start gap-2 rounded bg-muted/30 p-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono shrink-0 mt-0.5">
                  {ACTION_TYPE_LABEL[a.tipo] ?? a.tipo}
                </span>
                <p className="text-xs text-foreground flex-1">{a.descricao}</p>
                <button
                  onClick={() => void handleCreateAction(a.tipo, a.descricao)}
                  disabled={creatingAction === a.tipo}
                  className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {creatingAction === a.tipo ? "Criando…" : "Criar ação"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações vinculadas */}
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Ações <span className="text-muted-foreground font-normal">({actions.length})</span>
        </h3>

        {actions.length > 0 ? (
          <div className="space-y-1.5">
            {actions.map((a) => {
              const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== "concluida" && a.status !== "verificada";
              return (
                <div key={a.id} className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono shrink-0">
                    {ACTION_TYPE_LABEL[a.type] ?? a.type}
                  </span>
                  <span className="flex-1 text-foreground truncate">{a.description || "—"}</span>
                  {a.due_date && (
                    <span className={`text-xs font-mono shrink-0 ${isOverdue ? "text-[var(--nc)]" : "text-muted-foreground"}`}>
                      {new Date(a.due_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  <span className={`text-xs shrink-0 ${
                    a.status === "concluida" || a.status === "verificada" ? "text-[var(--ok)]" : "text-muted-foreground"
                  }`}>
                    {ACTION_STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <Link href={`/acoes/${a.id}`} className="text-primary hover:underline shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma ação vinculada.</p>
        )}
      </div>
    </div>
  );
}
