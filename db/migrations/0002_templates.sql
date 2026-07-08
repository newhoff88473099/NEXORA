-- ============================================================
-- NEXORA — Migration 0002: Templates de Checklist
-- Ordem: tabelas → RLS → policies → triggers
-- ============================================================

-- ── Tabelas ──────────────────────────────────────────────────

create table public.templates (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid references public.organizations(id) on delete cascade,
  -- null quando is_library = true
  title        text not null,
  category     text not null default 'operacional'
               check (category in ('seguranca', 'qualidade', 'operacional', 'laboratorio')),
  norm_ref     text,
  version      integer not null default 1,
  status       text not null default 'draft'
               check (status in ('draft', 'published', 'archived')),
  is_library   boolean not null default false,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.template_sections (
  id           uuid primary key default uuid_generate_v4(),
  template_id  uuid not null references public.templates(id) on delete cascade,
  title        text not null,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.template_items (
  id                     uuid primary key default uuid_generate_v4(),
  section_id             uuid not null references public.template_sections(id) on delete cascade,
  question               text not null,
  response_type          text not null default 'conforme_nc_na'
                         check (response_type in (
                           'conforme_nc_na', 'escala', 'numero',
                           'texto', 'foto', 'assinatura', 'multipla'
                         )),
  weight                 integer not null default 1 check (weight between 1 and 10),
  norm_clause            text,
  help_text              text,
  requires_photo_on_nc   boolean not null default false,
  requires_action_on_nc  boolean not null default false,
  unit                   text,
  min_value              numeric,
  max_value              numeric,
  options                jsonb,
  order_index            integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── RLS — habilitar ──────────────────────────────────────────

alter table public.templates        enable row level security;
alter table public.template_sections enable row level security;
alter table public.template_items    enable row level security;

-- ── Policies: templates ──────────────────────────────────────

-- Leitura: próprios ou biblioteca
create policy "templates: select own + library"
  on public.templates for select
  using (is_library = true or org_id = public.org_id());

-- Insert: somente próprios, nunca biblioteca
create policy "templates: insert own"
  on public.templates for insert
  with check (org_id = public.org_id() and is_library = false);

-- Update: somente próprios, nunca biblioteca
create policy "templates: update own"
  on public.templates for update
  using (org_id = public.org_id() and is_library = false);

-- Delete: somente rascunhos próprios
create policy "templates: delete own draft"
  on public.templates for delete
  using (org_id = public.org_id() and is_library = false and status = 'draft');

-- ── Policies: template_sections ──────────────────────────────

create policy "sections: select"
  on public.template_sections for select
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_sections.template_id
        and (t.is_library = true or t.org_id = public.org_id())
    )
  );

create policy "sections: insert"
  on public.template_sections for insert
  with check (
    exists (
      select 1 from public.templates t
      where t.id = template_sections.template_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

create policy "sections: update"
  on public.template_sections for update
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_sections.template_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

create policy "sections: delete"
  on public.template_sections for delete
  using (
    exists (
      select 1 from public.templates t
      where t.id = template_sections.template_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

-- ── Policies: template_items ─────────────────────────────────

create policy "items: select"
  on public.template_items for select
  using (
    exists (
      select 1 from public.template_sections s
      join public.templates t on t.id = s.template_id
      where s.id = template_items.section_id
        and (t.is_library = true or t.org_id = public.org_id())
    )
  );

create policy "items: insert"
  on public.template_items for insert
  with check (
    exists (
      select 1 from public.template_sections s
      join public.templates t on t.id = s.template_id
      where s.id = template_items.section_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

create policy "items: update"
  on public.template_items for update
  using (
    exists (
      select 1 from public.template_sections s
      join public.templates t on t.id = s.template_id
      where s.id = template_items.section_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

create policy "items: delete"
  on public.template_items for delete
  using (
    exists (
      select 1 from public.template_sections s
      join public.templates t on t.id = s.template_id
      where s.id = template_items.section_id
        and t.org_id = public.org_id()
        and t.is_library = false
    )
  );

-- ── Triggers de updated_at ────────────────────────────────────

create trigger set_updated_at_templates
  before update on public.templates
  for each row execute function public.set_updated_at();

create trigger set_updated_at_template_sections
  before update on public.template_sections
  for each row execute function public.set_updated_at();

create trigger set_updated_at_template_items
  before update on public.template_items
  for each row execute function public.set_updated_at();
