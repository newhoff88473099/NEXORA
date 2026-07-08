"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAudit } from "../actions";
import { createClient } from "@/lib/supabase/client";

type Template = { id: string; title: string; category: string; version: number; is_library: boolean };
type Plant = { id: string; name: string };

const CATEGORY_LABEL: Record<string, string> = {
  seguranca: "Segurança",
  qualidade: "Qualidade",
  operacional: "Operacional",
  laboratorio: "Laboratório",
};

export default function NovaAuditoriaPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("templates")
        .select("id, title, category, version, is_library")
        .eq("status", "published")
        .order("is_library", { ascending: false })
        .order("title"),
      supabase.from("plants").select("id, name").order("name"),
    ]).then(([{ data: tpls }, { data: pls }]) => {
      setTemplates(tpls ?? []);
      setPlants(pls ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/auditorias" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Auditorias
        </Link>
        <span>/</span>
        <span className="text-foreground">Nova auditoria</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Nova auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o checklist, planta e dados do auditado.
        </p>
      </div>

      <form action={createAudit} className="space-y-4 rounded border border-border bg-card p-5">
        {/* Filtro de categoria */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Filtrar por categoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Template */}
        <div className="space-y-1.5">
          <label htmlFor="template_id" className="text-sm font-medium text-foreground">
            Checklist <span className="text-destructive">*</span>
          </label>
          <select
            id="template_id"
            name="template_id"
            required
            disabled={loading}
            className="w-full h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">
              {loading ? "Carregando…" : "Selecione um checklist…"}
            </option>
            {filtered.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}{t.is_library ? " (Biblioteca)" : ""} — v{t.version}
              </option>
            ))}
          </select>
        </div>

        {/* Planta */}
        <div className="space-y-1.5">
          <label htmlFor="plant_id" className="text-sm font-medium text-foreground">
            Planta / Unidade
          </label>
          <select
            id="plant_id"
            name="plant_id"
            disabled={loading}
            className="w-full h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">Sem planta vinculada</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Nome do auditado */}
        <div className="space-y-1.5">
          <label htmlFor="auditee_name" className="text-sm font-medium text-foreground">
            Nome do auditado
          </label>
          <input
            id="auditee_name"
            name="auditee_name"
            type="text"
            placeholder="Ex: João Silva"
            className="w-full h-9 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Data */}
        <div className="space-y-1.5">
          <label htmlFor="scheduled_at" className="text-sm font-medium text-foreground">
            Data da auditoria
          </label>
          <input
            id="scheduled_at"
            name="scheduled_at"
            type="date"
            defaultValue={today}
            className="w-full h-9 px-3 rounded border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/auditorias"
            className="flex-1 h-9 flex items-center justify-center rounded border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-9 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Iniciar auditoria
          </button>
        </div>
      </form>
    </div>
  );
}
