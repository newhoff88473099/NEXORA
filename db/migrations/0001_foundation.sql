  -- ============================================================
  -- NEXORA — Migration 0001: Foundation
  -- Ordem: extensões → tabelas → função org_id → RLS → triggers → hook
  -- ============================================================

  -- ── Extensões ─────────────────────────────────────────────
  create extension if not exists "uuid-ossp";
  create extension if not exists "pgcrypto";

  -- ── Tabelas (sem RLS por enquanto) ────────────────────────

  create table public.organizations (
    id         uuid primary key default uuid_generate_v4(),
    name       text not null,
    cnpj       text not null unique,
    plan       text not null default 'trial',
    logo_url   text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.memberships (
    id         uuid primary key default uuid_generate_v4(),
    org_id     uuid not null references public.organizations(id) on delete cascade,
    user_id    uuid not null references auth.users(id) on delete cascade,
    role       text not null check (role in ('owner', 'admin', 'auditor', 'inspetor', 'leitor')),
    created_at timestamptz not null default now(),
    unique (org_id, user_id)
  );

  create table public.invitations (
    id          uuid primary key default uuid_generate_v4(),
    org_id      uuid not null references public.organizations(id) on delete cascade,
    email       text not null,
    role        text not null check (role in ('admin', 'auditor', 'inspetor', 'leitor')),
    invited_by  uuid references auth.users(id),
    token       text not null unique default encode(gen_random_bytes(32), 'hex'),
    accepted_at timestamptz,
    expires_at  timestamptz not null default (now() + interval '7 days'),
    created_at  timestamptz not null default now()
  );

  create table public.plants (
    id         uuid primary key default uuid_generate_v4(),
    org_id     uuid not null references public.organizations(id) on delete cascade,
    name       text not null,
    address    text,
    cnpj       text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.areas (
    id             uuid primary key default uuid_generate_v4(),
    plant_id       uuid not null references public.plants(id) on delete cascade,
    name           text not null,
    parent_area_id uuid references public.areas(id) on delete set null,
    created_at     timestamptz not null default now()
  );

  create table public.subscriptions (
    id                  uuid primary key default uuid_generate_v4(),
    org_id              uuid not null references public.organizations(id) on delete cascade,
    stripe_customer_id  text,
    stripe_sub_id       text,
    plan                text not null default 'trial',
    status              text not null default 'trialing',
    current_period_end  timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (org_id)
  );

  -- ── Função auxiliar de tenant ─────────────────────────────
  -- Criada APÓS memberships para que a referência seja válida.
  -- Lê org_id do claim JWT (injetado pelo Auth Hook) com fallback em memberships.
  create or replace function public.org_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(
      nullif((auth.jwt() ->> 'org_id'), '')::uuid,
      (
        select org_id
        from public.memberships
        where user_id = auth.uid()
        limit 1
      )
    );
  $$;

  -- ── RLS — habilitar em todas as tabelas ───────────────────
  alter table public.organizations  enable row level security;
  alter table public.memberships    enable row level security;
  alter table public.invitations    enable row level security;
  alter table public.plants         enable row level security;
  alter table public.areas          enable row level security;
  alter table public.subscriptions  enable row level security;

  -- ── Policies: organizations ───────────────────────────────
  create policy "org: leitura pelo membro"
    on public.organizations for select
    using (id = public.org_id());

  create policy "org: atualização pelo owner"
    on public.organizations for update
    using (
      id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.organizations.id
          and user_id = auth.uid()
          and role = 'owner'
      )
    );

  -- Insert feito via service_role nos server actions (bypass RLS automático)
  create policy "org: insert via service_role"
    on public.organizations for insert
    with check (true);

  -- ── Policies: memberships ─────────────────────────────────
  create policy "memberships: leitura pelo membro da org"
    on public.memberships for select
    using (org_id = public.org_id());

  create policy "memberships: insert via service_role"
    on public.memberships for insert
    with check (true);

  create policy "memberships: owner e admin gerenciam"
    on public.memberships for update
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships m2
        where m2.org_id = public.memberships.org_id
          and m2.user_id = auth.uid()
          and m2.role in ('owner', 'admin')
      )
    );

  create policy "memberships: owner e admin removem"
    on public.memberships for delete
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships m2
        where m2.org_id = public.memberships.org_id
          and m2.user_id = auth.uid()
          and m2.role in ('owner', 'admin')
      )
    );

  -- ── Policies: invitations ─────────────────────────────────
  create policy "invitations: leitura pelo membro admin+"
    on public.invitations for select
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.invitations.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  create policy "invitations: insert pelo membro admin+"
    on public.invitations for insert
    with check (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.invitations.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  create policy "invitations: aceitar por token"
    on public.invitations for update
    using (accepted_at is null and expires_at > now());

  -- ── Policies: plants ──────────────────────────────────────
  create policy "plants: leitura pelo membro"
    on public.plants for select
    using (org_id = public.org_id());

  create policy "plants: escrita por admin+"
    on public.plants for insert
    with check (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.plants.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  create policy "plants: atualização por admin+"
    on public.plants for update
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.plants.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  create policy "plants: remoção por admin+"
    on public.plants for delete
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.plants.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  -- ── Policies: areas ───────────────────────────────────────
  create policy "areas: leitura pelo membro"
    on public.areas for select
    using (
      exists (
        select 1 from public.plants
        where plants.id = public.areas.plant_id
          and plants.org_id = public.org_id()
      )
    );

  create policy "areas: escrita por admin+"
    on public.areas for insert
    with check (
      exists (
        select 1 from public.plants
        join public.memberships on memberships.org_id = plants.org_id
        where plants.id = public.areas.plant_id
          and memberships.user_id = auth.uid()
          and memberships.role in ('owner', 'admin')
      )
    );

  create policy "areas: atualização por admin+"
    on public.areas for update
    using (
      exists (
        select 1 from public.plants
        join public.memberships on memberships.org_id = plants.org_id
        where plants.id = public.areas.plant_id
          and memberships.user_id = auth.uid()
          and memberships.role in ('owner', 'admin')
      )
    );

  create policy "areas: remoção por admin+"
    on public.areas for delete
    using (
      exists (
        select 1 from public.plants
        join public.memberships on memberships.org_id = plants.org_id
        where plants.id = public.areas.plant_id
          and memberships.user_id = auth.uid()
          and memberships.role in ('owner', 'admin')
      )
    );

  -- ── Policies: subscriptions ───────────────────────────────
  create policy "subscriptions: leitura pelo owner"
    on public.subscriptions for select
    using (
      org_id = public.org_id()
      and exists (
        select 1 from public.memberships
        where org_id = public.subscriptions.org_id
          and user_id = auth.uid()
          and role in ('owner', 'admin')
      )
    );

  -- ── Triggers de updated_at ────────────────────────────────
  create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

  create trigger set_updated_at_organizations
    before update on public.organizations
    for each row execute function public.set_updated_at();

  create trigger set_updated_at_plants
    before update on public.plants
    for each row execute function public.set_updated_at();

  create trigger set_updated_at_subscriptions
    before update on public.subscriptions
    for each row execute function public.set_updated_at();

  -- ── Auth Hook: custom_access_token ────────────────────────
  -- Injeta org_id e org_role no JWT de cada login.
  -- Ativar em: Dashboard → Authentication → Hooks → Custom Access Token
  -- Função: public.custom_access_token_hook
  create or replace function public.custom_access_token_hook(event jsonb)
  returns jsonb
  language plpgsql
  stable
  as $$
  declare
    claims    jsonb;
    v_org_id  uuid;
    v_role    text;
  begin
    claims := event -> 'claims';

    select m.org_id, m.role
      into v_org_id, v_role
      from public.memberships m
    where m.user_id = (event ->> 'user_id')::uuid
    limit 1;

    if v_org_id is not null then
      claims := jsonb_set(claims, '{org_id}', to_jsonb(v_org_id::text));
      claims := jsonb_set(claims, '{org_role}', to_jsonb(v_role));
    end if;

    return jsonb_set(event, '{claims}', claims);
  end;
  $$;

  grant usage on schema public to supabase_auth_admin;
  grant execute on function public.custom_access_token_hook to supabase_auth_admin;
  revoke execute on function public.custom_access_token_hook from authenticated, anon;
