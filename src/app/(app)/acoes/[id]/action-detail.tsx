"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { updateActionStatus, updateActionDetails, updateEvidence } from "../actions";
import { createClient } from "@/lib/supabase/client";

// ── Constantes ────────────────────────────────────────────────

const STATUS_STEPS = ["a_fazer", "em_andamento", "concluida", "verificada"] as const;

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  a_fazer:      { label: "A fazer",       color: "text-muted-foreground", bg: "bg-muted border-border" },
  em_andamento: { label: "Em andamento",  color: "text-[var(--info)]", bg: "bg-[var(--info)]/10 border-[var(--info)]/20" },
  concluida:    { label: "Concluída",     color: "text-[var(--ok)]", bg: "bg-[#1E6B4F]/10 border-[#1E6B4F]/20" },
  verificada:   { label: "Verificada",    color: "text-[var(--verified)]", bg: "bg-[var(--verified)]/10 border-[var(--verified)]/20" },
};

const SEV_COLOR: Record<string, string> = {
  critica:    "text-[var(--nc)] bg-[#B3261E]/10 border-[#B3261E]/30",
  maior:      "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/30",
  menor:      "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
  observacao: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};

const SEV_LABEL: Record<string, string> = {
  critica: "Crítica", maior: "Maior", menor: "Menor", observacao: "Observação",
};

const TYPE_OPTS = [
  { value: "corretiva",  label: "Corretiva" },
  { value: "preventiva", label: "Preventiva" },
  { value: "contencao",  label: "Contenção" },
];

// ── Tipos ─────────────────────────────────────────────────────

type ActionData = {
  id: string;
  type: string;
  description: string | null;
  status: string;
  due_date: string | null;
  owner_id: string | null;
  evidence_photos: string[];
  created_at: string;
};

type FindingData = {
  id: string;
  code: string;
  severity: string;
  description: string | null;
  root_cause: string | null;
};

type AuditData = {
  id: string;
  auditee_name: string | null;
  started_at: string | null;
  template_title: string;
};

type Member = { id: string; email: string; name: string; role: string };

type Props = {
  action: ActionData;
  finding: FindingData | null;
  audit: AuditData | null;
  members: Member[];
  currentUserId: string;
};

// ── Componente ────────────────────────────────────────────────

export function ActionDetail({ action: initial, finding, audit, members, currentUserId }: Props) {
  const [status, setStatus] = useState(initial.status);
  const [type, setType] = useState(initial.type);
  const [description, setDescription] = useState(initial.description ?? "");
  const [dueDate, setDueDate] = useState(initial.due_date ?? "");
  const [ownerId, setOwnerId] = useState(initial.owner_id ?? "");
  const [photos, setPhotos] = useState<string[]>(initial.evidence_photos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const descTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentStep = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);

  // ── Mudança de status ──────────────────────────────────────

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(() => { void updateActionStatus(initial.id, newStatus); });
  }

  // ── Edição de campos ───────────────────────────────────────

  function handleDescription(v: string) {
    setDescription(v);
    clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      startTransition(() => { void updateActionDetails(initial.id, { description: v }); });
    }, 1000);
  }

  function handleType(v: string) {
    setType(v);
    startTransition(() => { void updateActionDetails(initial.id, { type: v }); });
  }

  function handleDueDate(v: string) {
    setDueDate(v);
    startTransition(() => { void updateActionDetails(initial.id, { due_date: v || null }); });
  }

  function handleOwner(v: string) {
    setOwnerId(v);
    startTransition(() => { void updateActionDetails(initial.id, { owner_id: v || null }); });
  }

  // ── Upload de evidência ────────────────────────────────────

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { default: compress } = await import("browser-image-compression");
      const supabase = createClient();
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        const compressed = await compress(file, { maxWidthOrHeight: 1920, maxSizeMB: 0.3, useWebWorker: true });
        const path = `actions/${initial.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage
          .from("audit-photos")
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (!error) {
          const { data } = supabase.storage.from("audit-photos").getPublicUrl(path);
          newPhotos.push(data.publicUrl);
        }
      }

      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      startTransition(() => { void updateEvidence(initial.id, updated); });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    const updated = photos.filter((p) => p !== url);
    setPhotos(updated);
    startTransition(() => { void updateEvidence(initial.id, updated); });
  }

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== "concluida" && status !== "verificada";
  const ownerMember = members.find((m) => m.id === ownerId);
  const isMyAction = ownerId === currentUserId || ownerId === "";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/acoes" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Plano de Ação
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{finding?.code ?? "Ação"}</span>
      </div>

      {/* Contexto da NC */}
      {finding && (
        <div className="rounded border border-border bg-card p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{finding.code}</span>
                <span className={`text-xs px-1.5 py-0 rounded border ${SEV_COLOR[finding.severity]}`}>
                  {SEV_LABEL[finding.severity] ?? finding.severity}
                </span>
              </div>
              {finding.description && (
                <p className="text-sm text-muted-foreground">{finding.description}</p>
              )}
              {finding.root_cause && (
                <p className="text-xs text-muted-foreground italic">Causa raiz: {finding.root_cause}</p>
              )}
            </div>
          </div>
          {audit && (
            <div className="flex gap-3 text-xs text-muted-foreground border-t border-border pt-2">
              <Link href={`/auditorias/${audit.id}`} className="hover:text-foreground transition-colors">
                {audit.template_title}
              </Link>
              {audit.auditee_name && <span>· {audit.auditee_name}</span>}
              {audit.started_at && (
                <span>· {new Date(audit.started_at).toLocaleDateString("pt-BR")}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progressão de status */}
      <div className="rounded border border-border bg-card p-4 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h2>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex flex-col items-center gap-1 flex-1 ${idx < STATUS_STEPS.length - 1 ? "" : ""}`}>
                  <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone
                      ? "bg-[var(--ok)] border-[var(--ok)] text-white"
                      : isCurrent
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                  }`}>
                    {isDone ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {STATUS[step].label}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 mx-1 transition-colors ${idx < currentStep ? "bg-[var(--ok)]" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Botões de progressão */}
        <div className="flex gap-2">
          {status !== "verificada" && (
            <button
              onClick={() => handleStatusChange(STATUS_STEPS[currentStep + 1])}
              disabled={isPending}
              className="flex-1 h-9 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {status === "a_fazer" && "Iniciar"}
              {status === "em_andamento" && "Marcar concluída"}
              {status === "concluida" && "Verificar"}
            </button>
          )}
          {status !== "a_fazer" && status !== "verificada" && (
            <button
              onClick={() => handleStatusChange(STATUS_STEPS[currentStep - 1])}
              disabled={isPending}
              className="px-3 h-9 border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Reabrir
            </button>
          )}
          {status === "verificada" && (
            <div className="flex items-center gap-2 text-sm text-[var(--verified)]">
              <CheckCircle className="h-4 w-4" />
              Ação verificada e encerrada
            </div>
          )}
        </div>

        {isOverdue && (
          <div className="flex items-center gap-2 text-xs text-[var(--nc)]">
            <AlertCircle className="h-3.5 w-3.5" />
            Prazo vencido em {new Date(dueDate).toLocaleDateString("pt-BR")}
          </div>
        )}
      </div>

      {/* Detalhes editáveis */}
      <div className="rounded border border-border bg-card p-4 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes</h2>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo de ação</label>
            <select
              value={type}
              onChange={(e) => handleType(e.target.value)}
              className="w-full h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {TYPE_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Prazo
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDate(e.target.value)}
              className={`w-full h-8 px-2 rounded border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary ${
                isOverdue ? "border-[var(--nc)] text-[var(--nc)]" : "border-border text-foreground"
              }`}
            />
          </div>
        </div>

        {/* Responsável */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Responsável</label>
          <select
            value={ownerId}
            onChange={(e) => handleOwner(e.target.value)}
            className="w-full h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Sem responsável</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email}{m.id === currentUserId ? " (você)" : ""}
              </option>
            ))}
          </select>
          {ownerMember && !isMyAction && (
            <p className="text-xs text-muted-foreground">{ownerMember.email}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descrição da ação</label>
          <textarea
            value={description}
            onChange={(e) => handleDescription(e.target.value)}
            rows={4}
            placeholder="Descreva a ação corretiva a ser tomada…"
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isPending && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Salvando…
            </p>
          )}
        </div>
      </div>

      {/* Evidências */}
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Evidências {photos.length > 0 && `(${photos.length})`}
        </h2>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              <div key={url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Evidência"
                  className="h-24 w-24 object-cover rounded border border-border cursor-pointer"
                  onClick={() => window.open(url, "_blank")}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded px-3 py-2 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {uploading ? "Enviando…" : "Adicionar evidência"}
        </button>
      </div>
    </div>
  );
}
