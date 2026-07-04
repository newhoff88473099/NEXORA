import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createTemplate, archiveTemplate, deleteTemplate, duplicateTemplate } from "./actions";
import { PlusIcon } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  seguranca: "Segurança",
  qualidade: "Qualidade",
  operacional: "Operacional",
  laboratorio: "Laboratório",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-[var(--warn)] bg-[#B87700]/10 border-[#B87700]/20",
  published: "text-[var(--ok)] bg-[#1E6B4F]/10 border-[#1E6B4F]/20",
  archived: "text-[var(--na)] bg-[#9AA09C]/10 border-[#9AA09C]/20",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";
  const categoryFilter = params.category ?? "";
  const statusFilter = params.status ?? "";

  let query = supabase
    .from("templates")
    .select("id, title, category, norm_ref, version, status, is_library, updated_at")
    .order("is_library", { ascending: true })
    .order("updated_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);
  if (categoryFilter) query = query.eq("category", categoryFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: templates } = await query;
  const own = (templates ?? []).filter((t) => !t.is_library);
  const library = (templates ?? []).filter((t) => t.is_library);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Modelos de Checklist
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {own.length} modelo{own.length !== 1 ? "s" : ""} da organização · {library.length} na biblioteca
          </p>
        </div>
        <form action={createTemplate}>
          <input type="hidden" name="title" value="Novo checklist" />
          <input type="hidden" name="category" value="operacional" />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Novo checklist
          </button>
        </form>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex gap-2 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar..."
          className="h-8 px-3 rounded border border-border bg-background text-sm w-48 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          name="category"
          defaultValue={categoryFilter}
          className="h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-8 px-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        <button type="submit" className="h-8 px-3 rounded border border-border bg-background text-sm hover:bg-muted transition-colors">
          Filtrar
        </button>
      </form>

      {/* Meus templates */}
      {own.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Minha organização
          </h2>
          <TemplateTable templates={own} isOwn />
        </section>
      )}

      {own.length === 0 && !search && (
        <div className="rounded border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhum modelo criado ainda.{" "}
          <form action={createTemplate} className="inline">
            <input type="hidden" name="title" value="Novo checklist" />
            <input type="hidden" name="category" value="operacional" />
            <button type="submit" className="text-primary hover:underline">
              Criar o primeiro checklist
            </button>
          </form>
        </div>
      )}

      {/* Biblioteca */}
      {library.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Biblioteca NEXORA
          </h2>
          <TemplateTable templates={library} isOwn={false} />
        </section>
      )}
    </div>
  );
}

type TemplateRow = {
  id: string;
  title: string;
  category: string;
  norm_ref: string | null;
  version: number;
  status: string;
  is_library: boolean;
  updated_at: string;
};

function TemplateTable({ templates, isOwn }: { templates: TemplateRow[]; isOwn: boolean }) {
  return (
    <div className="rounded border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Título</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Categoria</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Norma</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-16">Versão</th>
            {isOwn && <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>}
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Atualizado</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {templates.map((t) => (
            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-medium text-foreground">
                <Link href={`/templates/${t.id}`} className="hover:text-primary transition-colors">
                  {t.title}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {CATEGORY_LABELS[t.category] ?? t.category}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">
                {t.norm_ref ?? "—"}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                v{t.version}
              </td>
              {isOwn && (
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </td>
              )}
              <td className="px-3 py-2.5 text-muted-foreground text-xs">
                {formatDate(t.updated_at)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <RowActions template={t} isOwn={isOwn} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ template: t, isOwn }: { template: TemplateRow; isOwn: boolean }) {
  if (!isOwn) {
    return (
      <form action={duplicateTemplate.bind(null, t.id, false) as unknown as (fd: FormData) => void}>
        <button type="submit" className="text-xs text-primary hover:underline">
          Copiar para minha org
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {t.status === "draft" && (
        <>
          <Link href={`/templates/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Editar
          </Link>
          <form action={duplicateTemplate.bind(null, t.id, false) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Duplicar
            </button>
          </form>
          <form action={deleteTemplate.bind(null, t.id) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-destructive hover:text-destructive/80 transition-colors">
              Excluir
            </button>
          </form>
        </>
      )}
      {t.status === "published" && (
        <>
          <Link href={`/templates/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Visualizar
          </Link>
          <form action={duplicateTemplate.bind(null, t.id, true) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-primary hover:underline">
              Nova versão
            </button>
          </form>
          <form action={duplicateTemplate.bind(null, t.id, false) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Duplicar
            </button>
          </form>
          <form action={archiveTemplate.bind(null, t.id) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Arquivar
            </button>
          </form>
        </>
      )}
      {t.status === "archived" && (
        <>
          <Link href={`/templates/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Visualizar
          </Link>
          <form action={duplicateTemplate.bind(null, t.id, false) as unknown as (fd: FormData) => void}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Duplicar
            </button>
          </form>
        </>
      )}
    </div>
  );
}
