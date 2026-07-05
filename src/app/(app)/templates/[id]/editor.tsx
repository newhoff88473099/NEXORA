"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  updateTemplateMetadata,
  publishTemplate,
  duplicateTemplate,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  importChecklist,
} from "../actions";

// ── Tipos ────────────────────────────────────────────────────

export type ResponseType =
  | "conforme_nc_na"
  | "escala"
  | "numero"
  | "texto"
  | "foto"
  | "assinatura"
  | "multipla";

export type ItemData = {
  id: string;
  question: string;
  response_type: ResponseType;
  weight: number;
  norm_clause: string;
  help_text: string;
  requires_photo_on_nc: boolean;
  requires_action_on_nc: boolean;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  options: string[];
  order_index: number;
};

export type SectionData = {
  id: string;
  title: string;
  order_index: number;
  template_items: ItemData[];
};

export type TemplateData = {
  id: string;
  title: string;
  category: string;
  norm_ref: string | null;
  version: number;
  status: string;
  is_library: boolean;
  template_sections: SectionData[];
};

const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  conforme_nc_na: "C / NC / N.A.",
  escala: "Escala 1–5",
  numero: "Número",
  texto: "Texto",
  foto: "Foto",
  assinatura: "Assinatura",
  multipla: "Múltipla escolha",
};

const CATEGORY_LABELS: Record<string, string> = {
  seguranca: "Segurança",
  qualidade: "Qualidade",
  operacional: "Operacional",
  laboratorio: "Laboratório",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Componente principal ──────────────────────────────────────

export function TemplateEditor({
  template: initial,
  canEdit,
}: {
  template: TemplateData;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [normRef, setNormRef] = useState(initial.norm_ref ?? "");
  const [sections, setSections] = useState<SectionData[]>(initial.template_sections);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(initial.template_sections.map((s) => s.id))
  );
  const [isPending, startTransition] = useTransition();

  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; });

  // Timers de autosave por entidade
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    setLastSaved(new Date());
  }, []);

  const scheduleTemplateSave = useCallback(
    (newTitle: string, newCategory: string, newNormRef: string) => {
      clearTimeout(saveTimers.current["template"]);
      setSaveStatus("saving");
      saveTimers.current["template"] = setTimeout(async () => {
        await updateTemplateMetadata(initial.id, {
          title: newTitle,
          category: newCategory,
          norm_ref: newNormRef || null,
        });
        markSaved();
      }, 1200);
    },
    [initial.id, markSaved]
  );

  const scheduleSectionSave = useCallback(
    (id: string, newTitle: string) => {
      clearTimeout(saveTimers.current[`section-${id}`]);
      setSaveStatus("saving");
      saveTimers.current[`section-${id}`] = setTimeout(async () => {
        await updateSection(id, newTitle);
        markSaved();
      }, 1200);
    },
    [markSaved]
  );

  const scheduleItemSave = useCallback(
    (id: string, data: Partial<ItemData>) => {
      clearTimeout(saveTimers.current[`item-${id}`]);
      setSaveStatus("saving");
      saveTimers.current[`item-${id}`] = setTimeout(async () => {
        await updateItem(id, {
          question: data.question,
          response_type: data.response_type,
          weight: data.weight,
          norm_clause: data.norm_clause,
          help_text: data.help_text,
          requires_photo_on_nc: data.requires_photo_on_nc,
          requires_action_on_nc: data.requires_action_on_nc,
          unit: data.unit,
          min_value: data.min_value ?? null,
          max_value: data.max_value ?? null,
          options: data.options,
        });
        markSaved();
      }, 1200);
    },
    [markSaved]
  );

  // ── Mutações estruturais ────────────────────────────────────

  async function handleAddSection() {
    const result = await createSection(initial.id, "Nova seção");
    if (result.id) {
      const newSection: SectionData = {
        id: result.id,
        title: "Nova seção",
        order_index: sections.length,
        template_items: [],
      };
      setSections((prev) => [...prev, newSection]);
      setExpandedSections((prev) => new Set([...prev, result.id!]));
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Excluir seção e todos os seus itens?")) return;
    await deleteSection(sectionId);
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  async function handleAddItem(sectionId: string) {
    const result = await createItem(sectionId);
    if (result.id) {
      const newItem: ItemData = {
        id: result.id,
        question: "Nova pergunta",
        response_type: "conforme_nc_na",
        weight: 5,
        norm_clause: "",
        help_text: "",
        requires_photo_on_nc: false,
        requires_action_on_nc: false,
        unit: "",
        min_value: null,
        max_value: null,
        options: [],
        order_index: (sections.find((s) => s.id === sectionId)?.template_items.length ?? 0),
      };
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, template_items: [...s.template_items, newItem] } : s
        )
      );
    }
  }

  async function handleDeleteItem(sectionId: string, itemId: string) {
    await deleteItem(itemId);
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, template_items: s.template_items.filter((i) => i.id !== itemId) }
          : s
      )
    );
  }

  function updateSectionLocal(sectionId: string, title: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
    scheduleSectionSave(sectionId, title);
  }

  function updateItemLocal(sectionId: string, itemId: string, patch: Partial<ItemData>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              template_items: s.template_items.map((i) =>
                i.id === itemId ? { ...i, ...patch } : i
              ),
            }
          : s
      )
    );
    const current = sectionsRef.current
      .find((s) => s.id === sectionId)
      ?.template_items.find((i) => i.id === itemId);
    if (current) scheduleItemSave(itemId, { ...current, ...patch });
  }

  // ── DnD ────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isSectionDrag = sections.some((s) => s.id === active.id);
    if (isSectionDrag) {
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({
          ...s,
          order_index: i,
        }));
        setSections(reordered);
        startTransition(() => {
          reorderSections(initial.id, reordered.map((s) => s.id));
        });
      }
      return;
    }

    // Item drag
    const ownerSection = sections.find((s) =>
      s.template_items.some((i) => i.id === active.id)
    );
    if (!ownerSection) return;
    const oldIdx = ownerSection.template_items.findIndex((i) => i.id === active.id);
    const newIdx = ownerSection.template_items.findIndex((i) => i.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      const reordered = arrayMove(ownerSection.template_items, oldIdx, newIdx).map(
        (item, i) => ({ ...item, order_index: i })
      );
      setSections((prev) =>
        prev.map((s) =>
          s.id === ownerSection.id ? { ...s, template_items: reordered } : s
        )
      );
      startTransition(() => {
        reorderItems(ownerSection.id, reordered.map((i) => i.id));
      });
    }
  }

  // ── Publicar ────────────────────────────────────────────────

  async function handlePublish() {
    if (!confirm("Publicar este template? Ele não poderá mais ser editado diretamente.")) return;
    const result = await publishTemplate(initial.id);
    if (!result.error) {
      window.location.reload();
    }
  }

  // ── Save status label ───────────────────────────────────────

  const saveLabel =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "saved" && lastSaved
      ? `Salvo · ${formatTime(lastSaved)}`
      : saveStatus === "error"
      ? "Erro ao salvar"
      : "";

  const isReadOnly = !canEdit;

  return (
    <div className="max-w-4xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/templates" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Checklists
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-xs">{title}</span>
      </div>

      {/* Header do template */}
      <div className="rounded border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {isReadOnly ? (
              <h1
                className="text-xl font-semibold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
            ) : (
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  scheduleTemplateSave(e.target.value, category, normRef);
                }}
                className="w-full text-xl font-semibold bg-transparent border-none outline-none text-foreground focus:ring-0 p-0"
                style={{ fontFamily: "var(--font-display)" }}
                placeholder="Título do checklist"
              />
            )}
            <div className="flex gap-2 flex-wrap">
              {isReadOnly ? (
                <>
                  <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </span>
                  {normRef && (
                    <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground font-mono">
                      {normRef}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      scheduleTemplateSave(title, e.target.value, normRef);
                    }}
                    className="text-xs px-2 py-0.5 rounded border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="seguranca">Segurança</option>
                    <option value="qualidade">Qualidade</option>
                    <option value="operacional">Operacional</option>
                    <option value="laboratorio">Laboratório</option>
                  </select>
                  <input
                    value={normRef}
                    onChange={(e) => {
                      setNormRef(e.target.value);
                      scheduleTemplateSave(title, category, e.target.value);
                    }}
                    placeholder="Norma de referência (ex: NR-12)"
                    className="text-xs px-2 py-0.5 rounded border border-border bg-background text-muted-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono w-52"
                  />
                </>
              )}
              <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground font-mono">
                v{initial.version}
              </span>
              {initial.is_library && (
                <span className="text-xs px-2 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary">
                  Biblioteca NEXORA
                </span>
              )}
            </div>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2 shrink-0">
            {saveLabel && (
              <span className="text-xs text-muted-foreground">{saveLabel}</span>
            )}
            {canEdit && (
              <button
                onClick={handlePublish}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Publicar
              </button>
            )}
            {initial.status === "published" && !initial.is_library && (
              <form action={duplicateTemplate.bind(null, initial.id, true) as unknown as (fd: FormData) => void}>
                <button type="submit" className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted transition-colors">
                  Criar nova versão
                </button>
              </form>
            )}
            {initial.is_library && (
              <form action={duplicateTemplate.bind(null, initial.id, false) as unknown as (fd: FormData) => void}>
                <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                  Copiar para minha organização
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="text-xs text-muted-foreground border-t border-border pt-2 flex gap-4">
          <span>{sections.length} seções</span>
          <span>{sections.reduce((n, s) => n + s.template_items.length, 0)} itens</span>
        </div>
      </div>

      {/* Gerar com IA */}
      {canEdit && (
        <GeneratePanel
          templateId={initial.id}
          onSectionsAdded={(newSections) => {
            setSections((prev) => [...prev, ...newSections]);
            setExpandedSections((prev) => {
              const next = new Set(prev);
              newSections.forEach((s) => next.add(s.id));
              return next;
            });
          }}
        />
      )}

      {/* Editor de seções */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                canEdit={canEdit}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() =>
                  setExpandedSections((prev) => {
                    const next = new Set(prev);
                    if (next.has(section.id)) { next.delete(section.id); } else { next.add(section.id); }
                    return next;
                  })
                }
                onTitleChange={(t) => updateSectionLocal(section.id, t)}
                onDelete={() => handleDeleteSection(section.id)}
                onAddItem={() => handleAddItem(section.id)}
                onItemChange={(itemId, patch) =>
                  updateItemLocal(section.id, itemId, patch)
                }
                onItemDelete={(itemId) => handleDeleteItem(section.id, itemId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {canEdit && (
        <button
          onClick={handleAddSection}
          className="flex items-center gap-1.5 w-full py-2 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4 mx-auto" />
          <span>Adicionar seção</span>
        </button>
      )}
    </div>
  );
}

// ── GeneratePanel ─────────────────────────────────────────────

type AiSection = {
  title: string;
  items: Array<{
    question: string;
    response_type: string;
    weight: number;
    norm_clause?: string;
    requires_photo_on_nc?: boolean;
    requires_action_on_nc?: boolean;
  }>;
};

function GeneratePanel({
  templateId,
  onSectionsAdded,
}: {
  templateId: string;
  onSectionsAdded: (sections: SectionData[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<AiSection[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    setPreview(null);
    setError("");
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feature: "generate_checklist", payload: { input: input.trim() } }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (data.error) { setError(data.error); return; }
      const parsed = JSON.parse(data.text ?? "{}") as { sections?: AiSection[] };
      if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        setError("Não foi possível gerar um checklist válido. Tente descrever melhor o processo ou norma.");
        return;
      }
      setPreview(parsed.sections);
    } catch {
      setError("Erro ao processar resposta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    const result = await importChecklist(templateId, preview);
    if (result.sections) {
      onSectionsAdded(result.sections as SectionData[]);
      setPreview(null);
      setInput("");
      setOpen(false);
    }
    setImporting(false);
  }

  return (
    <div className="rounded border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">Gerar seções com IA</span>
        {open ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole um trecho de norma ou descreva o processo a auditar. O rascunho gerado pode ser editado antes de usar.
          </p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder="Ex: Requisitos da NR-12 para proteção de máquinas, seções 12.38 a 12.42…"
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="text-xs text-[var(--nc)]">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? "Gerando…" : "Gerar rascunho"}
            </button>
            {preview && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {importing ? "Adicionando…" : `Adicionar ${preview.length} seções ao template`}
              </button>
            )}
          </div>

          {preview && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                Rascunho gerado automaticamente — revise antes de adicionar.
              </p>
              {preview.map((sec, i) => (
                <div key={i} className="rounded border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{sec.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {sec.items.length} {sec.items.length === 1 ? "item" : "itens"}
                    {sec.items.length > 0 && `: ${sec.items[0].question.slice(0, 60)}${sec.items[0].question.length > 60 ? "…" : ""}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SortableSection ──────────────────────────────────────────

function SortableSection({
  section,
  canEdit,
  isExpanded,
  onToggle,
  onTitleChange,
  onDelete,
  onAddItem,
  onItemChange,
  onItemDelete,
}: {
  section: SectionData;
  canEdit: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onAddItem: () => void;
  onItemChange: (itemId: string, patch: Partial<ItemData>) => void;
  onItemDelete: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded border border-border bg-card">
      {/* Cabeçalho da seção */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {canEdit ? (
          <input
            value={section.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-foreground"
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-foreground">{section.title}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {section.template_items.length} {section.template_items.length === 1 ? "item" : "itens"}
        </span>
        {canEdit && (
          <>
            <button
              onClick={onAddItem}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Adicionar item"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Excluir seção"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Itens */}
      {isExpanded && (
        <div>
          <SortableContext
            items={section.template_items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.template_items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                canEdit={canEdit}
                onChange={(patch) => onItemChange(item.id, patch)}
                onDelete={() => onItemDelete(item.id)}
              />
            ))}
          </SortableContext>
          {section.template_items.length === 0 && canEdit && (
            <div className="py-4 text-center">
              <button
                onClick={onAddItem}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                + Adicionar primeiro item
              </button>
            </div>
          )}
          {section.template_items.length === 0 && !canEdit && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Seção sem itens
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SortableItem ─────────────────────────────────────────────

function SortableItem({
  item,
  canEdit,
  onChange,
  onDelete,
}: {
  item: ItemData;
  canEdit: boolean;
  onChange: (patch: Partial<ItemData>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const [expanded, setExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-b border-border last:border-b-0"
    >
      {/* Linha principal do item */}
      <div className="flex items-center gap-2 px-3 py-2">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Pergunta */}
        <div className="flex-1 min-w-0">
          {canEdit ? (
            <input
              value={item.question ?? ""}
              onChange={(e) => onChange({ question: e.target.value })}
              className="w-full text-sm bg-transparent border-none outline-none text-foreground"
              placeholder="Texto da pergunta"
            />
          ) : (
            <span className="text-sm text-foreground">{item.question}</span>
          )}
        </div>

        {/* Tipo de resposta */}
        {canEdit ? (
          <select
            value={item.response_type}
            onChange={(e) => onChange({ response_type: e.target.value as ResponseType })}
            className="text-xs px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
          >
            {Object.entries(RESPONSE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">
            {RESPONSE_TYPE_LABELS[item.response_type]}
          </span>
        )}

        {/* Peso */}
        {canEdit ? (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">Peso</span>
            <input
              type="number"
              value={item.weight}
              min={1}
              max={10}
              onChange={(e) => onChange({ weight: Number(e.target.value) })}
              className="w-10 text-xs px-1 py-0.5 rounded border border-border bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            p{item.weight}
          </span>
        )}

        {/* Expandir / excluir */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={expanded ? "Recolher" : "Expandir campos avançados"}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {canEdit && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            title="Excluir item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="px-10 pb-3 space-y-2 border-t border-border/50 bg-muted/20 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Cláusula da norma</span>
              <input
                readOnly={!canEdit}
                value={item.norm_clause ?? ""}
                onChange={(e) => onChange({ norm_clause: e.target.value })}
                placeholder="Ex: NR-12.38"
                className="w-full text-xs px-2 py-1 rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary read-only:bg-muted/30"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Texto de ajuda</span>
              <input
                readOnly={!canEdit}
                value={item.help_text ?? ""}
                onChange={(e) => onChange({ help_text: e.target.value })}
                placeholder="Instrução ao auditor"
                className="w-full text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary read-only:bg-muted/30"
              />
            </label>
          </div>

          {/* Campos condicionais por tipo */}
          {item.response_type === "numero" && canEdit && (
            <div className="flex gap-2">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Unidade</span>
                <input
                  value={item.unit ?? ""}
                  onChange={(e) => onChange({ unit: e.target.value })}
                  placeholder="Ex: mm, kg, ºC"
                  className="w-24 text-xs px-2 py-1 rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Mín.</span>
                <input
                  type="number"
                  value={item.min_value ?? ""}
                  onChange={(e) => onChange({ min_value: e.target.value ? Number(e.target.value) : null })}
                  className="w-20 text-xs px-2 py-1 rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Máx.</span>
                <input
                  type="number"
                  value={item.max_value ?? ""}
                  onChange={(e) => onChange({ max_value: e.target.value ? Number(e.target.value) : null })}
                  className="w-20 text-xs px-2 py-1 rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={item.requires_photo_on_nc}
                onChange={(e) => onChange({ requires_photo_on_nc: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">Exigir foto se NC</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={item.requires_action_on_nc}
                onChange={(e) => onChange({ requires_action_on_nc: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">Exigir ação se NC</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
