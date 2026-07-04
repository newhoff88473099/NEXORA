"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, MessageSquare, CheckCircle } from "lucide-react";
import { AnswerButtons } from "@/components/audit/answer-buttons";
import { NcModal } from "@/components/audit/nc-modal";
import { PhotoUploader } from "@/components/audit/photo-uploader";
import { SignatureCanvas } from "@/components/audit/signature-canvas";
import { saveAnswer, createFinding, finishAudit } from "../../actions";
import { createClient } from "@/lib/supabase/client";

// ── Tipos ────────────────────────────────────────────────────

type ItemData = {
  id: string;
  question: string;
  response_type: string;
  weight: number;
  norm_clause: string;
  help_text: string;
  requires_photo_on_nc: boolean;
  requires_action_on_nc: boolean;
  options: string[] | null;
  unit: string;
  min_value: number | null;
  max_value: number | null;
};

type SectionData = {
  id: string;
  title: string;
  order_index: number;
  template_items: ItemData[];
};

type AnswerState = {
  id?: string;
  response: string | null;
  note: string;
  photos: string[];
};

type FindingState = {
  id: string;
  code: string;
  severity: string;
};

type Props = {
  audit: {
    id: string;
    status: string;
    started_at: string | null;
    auditee_name: string | null;
    template_title: string;
  };
  sections: SectionData[];
  initialAnswers: Array<{ id?: string; template_item_id: string; response: string | null; note: string | null; photos: unknown }>;
  initialFindings: Array<{ id: string; answer_id: string | null; code: string; severity: string; description: string }>;
};

// ── ItemWidget (fora do pai para preservar estado local) ─────

type ItemWidgetProps = {
  item: ItemData;
  auditId: string;
  answer: AnswerState | undefined;
  finding: FindingState | undefined;
  onAnswer: (response: string) => void;
  onNote: (note: string) => void;
  onPhotos: (photos: string[]) => void;
};

function ItemWidget({ item, auditId, answer: ans, finding, onAnswer, onNote, onPhotos }: ItemWidgetProps) {
  const [showNote, setShowNote] = useState(!!ans?.note);
  const [showPhotos, setShowPhotos] = useState((ans?.photos?.length ?? 0) > 0);

  return (
    <div className="border-b border-border last:border-b-0 px-4 py-3 space-y-3">
      {/* Pergunta */}
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground leading-snug">{item.question}</p>
        {item.norm_clause && (
          <p className="text-xs text-muted-foreground font-mono">{item.norm_clause}</p>
        )}
        {item.help_text && (
          <p className="text-xs text-muted-foreground italic">{item.help_text}</p>
        )}
      </div>

      {/* Widget de resposta */}
      {item.response_type === "conforme_nc_na" && (
        <AnswerButtons
          value={ans?.response ?? null}
          onChange={(v) => onAnswer(v)}
        />
      )}

      {item.response_type === "escala" && (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const colors = ["bg-[var(--nc)]", "bg-orange-500", "bg-[var(--warn)]", "bg-lime-600", "bg-[var(--ok)]"];
            const isActive = ans?.response === String(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => onAnswer(String(n))}
                className={`flex-1 h-12 rounded text-sm font-bold transition-all ${
                  isActive ? `${colors[n - 1]} text-white` : "border border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}

      {item.response_type === "numero" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            defaultValue={ans?.response ?? ""}
            onBlur={(e) => {
              const v = e.target.value;
              if (v) onAnswer(v);
            }}
            placeholder="0"
            className="w-32 h-12 px-3 rounded border border-border bg-background text-lg font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {item.unit && <span className="text-sm text-muted-foreground font-mono">{item.unit}</span>}
          {(item.min_value !== null || item.max_value !== null) && (
            <span className="text-xs text-muted-foreground">
              ({item.min_value ?? "—"} – {item.max_value ?? "—"})
            </span>
          )}
        </div>
      )}

      {item.response_type === "texto" && (
        <textarea
          defaultValue={ans?.response ?? ""}
          onBlur={(e) => {
            if (e.target.value !== (ans?.response ?? "")) onAnswer(e.target.value);
          }}
          rows={3}
          placeholder="Escreva sua resposta…"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {item.response_type === "multipla" && (
        <div className="flex flex-col gap-1.5">
          {(item.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-border text-primary"
                checked={ans?.response ? (JSON.parse(ans.response) as string[]).includes(opt) : false}
                onChange={(e) => {
                  const current: string[] = ans?.response ? (JSON.parse(ans.response) as string[]) : [];
                  const next = e.target.checked
                    ? [...current, opt]
                    : current.filter((o) => o !== opt);
                  onAnswer(JSON.stringify(next));
                }}
              />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* NC badge */}
      {finding && (
        <div className="flex items-center gap-2 text-xs text-[var(--nc)] font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--nc)]" />
          {finding.code} · {finding.severity}
        </div>
      )}

      {/* Nota + Foto */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          className={`flex items-center gap-1 text-xs transition-colors ${showNote ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Nota
        </button>
        <button
          type="button"
          onClick={() => setShowPhotos(!showPhotos)}
          className={`flex items-center gap-1 text-xs transition-colors ${showPhotos ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <span className="text-xs">📷</span>
          Foto {(ans?.photos?.length ?? 0) > 0 && `(${ans!.photos.length})`}
        </button>
      </div>

      {showNote && (
        <textarea
          value={ans?.note ?? ""}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          placeholder="Nota rápida…"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {showPhotos && (
        <PhotoUploader
          photos={ans?.photos ?? []}
          auditId={auditId}
          itemId={item.id}
          onPhotosChange={onPhotos}
        />
      )}
    </div>
  );
}

// ── Cálculo de score ─────────────────────────────────────────

function calcScore(allItems: ItemData[], answers: Record<string, AnswerState>): number | null {
  let sumConf = 0;
  let sumAppl = 0;
  let hasAny = false;

  for (const item of allItems) {
    const a = answers[item.id];
    if (!a?.response) continue;
    hasAny = true;

    if (item.response_type === "conforme_nc_na") {
      if (a.response === "na") continue;
      sumAppl += item.weight;
      if (a.response === "conforme") sumConf += item.weight;
    } else if (item.response_type === "escala") {
      const v = parseInt(a.response, 10);
      if (isNaN(v)) continue;
      sumAppl += item.weight;
      sumConf += item.weight * (v / 5);
    } else {
      sumAppl += item.weight;
      sumConf += item.weight;
    }
  }
  if (!hasAny || sumAppl === 0) return null;
  return Math.round((sumConf / sumAppl) * 100);
}

function formatTimer(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function scoreColor(s: number) {
  if (s >= 80) return "text-[var(--ok)]";
  if (s >= 60) return "text-[var(--warn)]";
  return "text-[var(--nc)]";
}

// ── Executor principal ───────────────────────────────────────

export function AuditExecutor({ audit, sections, initialAnswers, initialFindings }: Props) {
  const allItems = sections.flatMap((s) => s.template_items);
  const [currentSection, setCurrentSection] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Respostas
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(
      initialAnswers.map((a) => [
        a.template_item_id,
        {
          id: a.id,
          response: a.response,
          note: a.note ?? "",
          photos: Array.isArray(a.photos) ? (a.photos as string[]) : [],
        },
      ])
    )
  );

  // Findings (por answer_id)
  const [findings, setFindings] = useState<Record<string, FindingState>>(() =>
    Object.fromEntries(
      initialFindings
        .filter((f) => f.answer_id)
        .map((f) => [f.answer_id!, { id: f.id, code: f.code, severity: f.severity }])
    )
  );

  // Modal de NC
  const [ncModal, setNcModal] = useState<ItemData | null>(null);
  const pendingNcItem = useRef<ItemData | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(() => {
    if (!audit.started_at) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(audit.started_at).getTime()) / 1000));
  });
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Notas por item (debounce)
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Progresso e score
  const answered = allItems.filter((i) => answers[i.id]?.response != null).length;
  const score = calcScore(allItems, answers);

  // ── Responder item ───────────────────────────────────────

  const handleAnswer = useCallback(
    (item: ItemData, response: string) => {
      setAnswers((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], response, note: prev[item.id]?.note ?? "", photos: prev[item.id]?.photos ?? [] },
      }));

      startTransition(() => {
        void (async () => {
          const result = await saveAnswer(audit.id, item.id, { response });
          if (result.id) {
            setAnswers((prev) => ({ ...prev, [item.id]: { ...prev[item.id], id: result.id } }));
          }
        })();
      });

      if (response === "nc") {
        pendingNcItem.current = item;
        setNcModal(item);
      }
    },
    [audit.id]
  );

  // ── Atualizar nota ────────────────────────────────────────

  function handleNote(itemId: string, note: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], note } }));
    clearTimeout(noteTimers.current[itemId]);
    noteTimers.current[itemId] = setTimeout(() => {
      startTransition(() => { void saveAnswer(audit.id, itemId, { note }); });
    }, 1000);
  }

  // ── Atualizar fotos ───────────────────────────────────────

  function handlePhotos(itemId: string, photos: string[]) {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], photos } }));
    startTransition(() => { void saveAnswer(audit.id, itemId, { photos }); });
  }

  // ── Confirmar NC ──────────────────────────────────────────

  async function handleNcConfirm(
    item: ItemData,
    data: { severity: string; description: string; norm_clause?: string; due_date?: string; action?: { type: string; description: string; due_date?: string } }
  ) {
    setNcModal(null);
    startTransition(() => {
      void (async () => {
        const result = await createFinding(audit.id, item.id, data);
        if (result.id) {
          const answerId = answers[item.id]?.id;
          if (answerId) {
            setFindings((prev) => ({ ...prev, [answerId]: { id: result.id!, code: result.code!, severity: data.severity } }));
          }
        }
      })();
    });
  }

  // ── Finalizar auditoria ───────────────────────────────────

  const [observations, setObservations] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  async function handleFinish() {
    setFinishing(true);
    let sigUrl: string | undefined;

    if (signature) {
      // Upload da assinatura para o Storage
      const supabase = createClient();
      const blob = await fetch(signature).then((r) => r.blob());
      const path = `${audit.id}/signature.png`;
      await supabase.storage.from("audit-signatures").upload(path, blob, {
        contentType: "image/png",
        upsert: true,
      });
      const { data } = supabase.storage.from("audit-signatures").getPublicUrl(path);
      sigUrl = data.publicUrl;
    }

    await finishAudit(audit.id, {
      observations,
      score: score ?? undefined,
      auditee_signature_url: sigUrl,
    });
  }

  // ── Layout ────────────────────────────────────────────────

  if (isFinalizing) {
    // Conta NCs por severidade
    const ncCount = Object.values(findings);
    const ncBySev = ncCount.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});
    const naCount = allItems.filter((i) => answers[i.id]?.response === "na").length;

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFinalizing(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Finalizar auditoria
          </h1>
        </div>

        {/* Resumo */}
        <div className="rounded border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Score final</span>
            {score !== null ? (
              <span className={`text-3xl font-bold font-mono ${scoreColor(score)}`}>{score}%</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="border-t border-border pt-3 flex gap-6 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Respondidos</div>
              <div className="font-mono font-medium">{answered}/{allItems.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">N.A.</div>
              <div className="font-mono font-medium">{naCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">NCs</div>
              <div className="font-mono font-medium text-[var(--nc)]">{ncCount.length}</div>
            </div>
          </div>

          {Object.entries(ncBySev).length > 0 && (
            <div className="flex gap-1.5 flex-wrap border-t border-border pt-3">
              {Object.entries(ncBySev).map(([sev, count]) => (
                <span key={sev} className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                  {count} {sev}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Observações gerais</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={4}
            placeholder="Observações adicionais sobre a auditoria…"
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Assinatura */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Assinatura do auditado
            {audit.auditee_name && <span className="text-muted-foreground font-normal"> — {audit.auditee_name}</span>}
          </label>
          <SignatureCanvas onCapture={(d) => setSignature(d)} />
        </div>

        {/* Concluir */}
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="w-full h-12 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          {finishing ? "Concluindo…" : "Concluir auditoria"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen -mt-6 -mx-6">
      {/* Header da execução */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link href="/auditorias" className="text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{audit.template_title}</div>
            <div className="text-xs text-muted-foreground">
              {answered}/{allItems.length} respondidos
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {score !== null && (
              <span className={`text-lg font-bold font-mono ${scoreColor(score)}`}>{score}%</span>
            )}
            <span className="text-xs text-muted-foreground font-mono">{formatTimer(elapsed)}</span>
            <button
              onClick={() => setIsFinalizing(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${allItems.length ? (answered / allItems.length) * 100 : 0}%` }}
          />
        </div>

        {/* Tabs de seção */}
        <div className="flex overflow-x-auto px-2 gap-0.5 border-t border-border">
          {sections.map((s, idx) => {
            const sectionAnswered = s.template_items.filter((i) => answers[i.id]?.response != null).length;
            const isComplete = sectionAnswered === s.template_items.length && s.template_items.length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentSection(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs border-b-2 transition-colors ${
                  currentSection === idx
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {isComplete && <span className="text-[var(--ok)] text-[10px]">✓</span>}
                {s.title}
                <span className="text-[10px] opacity-60">{sectionAnswered}/{s.template_items.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Itens da seção atual */}
      <div className="flex-1 pb-20">
        {sections[currentSection]?.template_items.map((item) => {
          const ans = answers[item.id];
          const finding = ans?.id ? findings[ans.id] : undefined;
          return (
            <ItemWidget
              key={item.id}
              item={item}
              auditId={audit.id}
              answer={ans}
              finding={finding}
              onAnswer={(r) => handleAnswer(item, r)}
              onNote={(n) => handleNote(item.id, n)}
              onPhotos={(p) => handlePhotos(item.id, p)}
            />
          );
        })}
      </div>

      {/* Navegação entre seções */}
      <div className="fixed bottom-0 left-56 right-0 bg-background border-t border-border px-4 py-3 flex justify-between">
        <button
          onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
          disabled={currentSection === 0}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Anterior
        </button>
        {currentSection < sections.length - 1 ? (
          <button
            onClick={() => setCurrentSection((s) => s + 1)}
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
          >
            Próxima seção
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsFinalizing(true)}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
          >
            Finalizar
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Modal de NC */}
      {ncModal && (
        <NcModal
          item={{ id: ncModal.id, question: ncModal.question, norm_clause: ncModal.norm_clause, requires_action_on_nc: ncModal.requires_action_on_nc }}
          onConfirm={(data) => handleNcConfirm(ncModal, data)}
          onCancel={() => {
            setNcModal(null);
            // Reverte para conforme se o usuário cancelar o modal
            setAnswers((prev) => ({
              ...prev,
              [ncModal.id]: { ...prev[ncModal.id], response: null },
            }));
          }}
        />
      )}
    </div>
  );
}
