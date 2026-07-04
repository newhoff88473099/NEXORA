"use client";

import { useState } from "react";
import { X } from "lucide-react";

type ItemData = {
  id: string;
  question: string;
  norm_clause: string;
  requires_action_on_nc: boolean;
};

type FindingData = {
  severity: string;
  description: string;
  norm_clause?: string;
  due_date?: string;
  action?: {
    type: string;
    description: string;
    due_date?: string;
  };
};

type Props = {
  item: ItemData;
  onConfirm: (data: FindingData) => void;
  onCancel: () => void;
};

const SEVERITY = [
  { value: "critica", label: "Crítica", color: "border-[var(--nc)] text-[var(--nc)] bg-[#B3261E]/5" },
  { value: "maior", label: "Maior", color: "border-[var(--warn)] text-[var(--warn)] bg-[#B87700]/5" },
  { value: "menor", label: "Menor", color: "border-blue-400 text-blue-700 bg-blue-50" },
  { value: "observacao", label: "Observação", color: "border-[var(--na)] text-[var(--na)] bg-[#9AA09C]/5" },
];

export function NcModal({ item, onConfirm, onCancel }: Props) {
  const [severity, setSeverity] = useState("menor");
  const [description, setDescription] = useState("");
  const [normClause, setNormClause] = useState(item.norm_clause ?? "");
  const [dueDate, setDueDate] = useState("");
  const [addAction, setAddAction] = useState(item.requires_action_on_nc);
  const [actionDesc, setActionDesc] = useState("");
  const [actionType, setActionType] = useState("corretiva");
  const [actionDue, setActionDue] = useState("");

  function handleSubmit() {
    if (!description.trim()) return;
    onConfirm({
      severity,
      description: description.trim(),
      norm_clause: normClause || undefined,
      due_date: dueDate || undefined,
      action: addAction && actionDesc.trim()
        ? { type: actionType, description: actionDesc.trim(), due_date: actionDue || undefined }
        : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Registrar Não Conformidade</h2>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.question}</p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Severidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Severidade</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`h-10 rounded border text-sm font-medium transition-all ${
                    severity === s.value
                      ? s.color
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Descrição <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a não conformidade observada…"
              rows={3}
              className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Cláusula */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Cláusula da norma</label>
            <input
              value={normClause}
              onChange={(e) => setNormClause(e.target.value)}
              placeholder="Ex: NR-12.38.1"
              className="w-full h-9 px-3 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Prazo para correção</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-9 px-3 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Ação corretiva */}
          <div className="space-y-2 rounded border border-border/60 p-3 bg-muted/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addAction}
                onChange={(e) => setAddAction(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span className="text-sm font-medium text-foreground">Registrar ação corretiva</span>
            </label>

            {addAction && (
              <div className="space-y-2 pt-1">
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="contencao">Contenção imediata</option>
                  <option value="corretiva">Ação corretiva</option>
                  <option value="preventiva">Ação preventiva</option>
                </select>
                <textarea
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Descreva a ação a ser tomada…"
                  rows={2}
                  className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="date"
                  value={actionDue}
                  onChange={(e) => setActionDue(e.target.value)}
                  className="w-full h-8 px-2 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="flex-1 h-9 rounded bg-[var(--nc)] text-white text-sm font-medium hover:bg-[#8B1C15] transition-colors disabled:opacity-50"
          >
            Registrar NC
          </button>
        </div>
      </div>
    </div>
  );
}
