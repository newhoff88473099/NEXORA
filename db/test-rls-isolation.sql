-- ============================================================
-- NEXORA — Teste de Isolamento RLS entre tenants
-- Executar no SQL Editor do Supabase em 3 passos:
--   PASSO 1: Criar dados de teste (rodar como postgres/service_role)
--   PASSO 2: Testar isolamento (simulando sessão autenticada)
--   PASSO 3: Limpar dados de teste
-- ============================================================

-- ============================================================
-- PASSO 1 — Criar dados de teste
-- (executar este bloco inteiro de uma vez)
-- ============================================================

-- Criar dois usuários usando Auth Admin API no Supabase Dashboard
-- Authentication → Users → Add user → Confirm email
-- Copiar os UUIDs gerados e substituir abaixo:
do $$
declare
  user_a_id uuid := 'SUBSTITUIR-UUID-DO-USUARIO-A';
  user_b_id uuid := 'SUBSTITUIR-UUID-DO-USUARIO-B';
  org_a_id  uuid;
  org_b_id  uuid;
begin
  -- Orgs
  insert into public.organizations (name, cnpj)
  values ('Org Alpha Ltda', '00.000.000/0001-00')
  returning id into org_a_id;

  insert into public.organizations (name, cnpj)
  values ('Org Beta S.A.', '11.111.111/0001-11')
  returning id into org_b_id;

  -- Memberships
  insert into public.memberships (org_id, user_id, role)
  values (org_a_id, user_a_id, 'owner');

  insert into public.memberships (org_id, user_id, role)
  values (org_b_id, user_b_id, 'owner');

  -- Plantas
  insert into public.plants (org_id, name) values (org_a_id, 'Planta Alpha 1');
  insert into public.plants (org_id, name) values (org_b_id, 'Planta Beta 1');

  raise notice 'Dados criados. Org A: %, Org B: %', org_a_id, org_b_id;
end $$;

-- ============================================================
-- PASSO 2 — Testar isolamento de RLS
-- Substituir os UUIDs abaixo pelos valores reais
-- (rodar cada bloco begin/commit separadamente)
-- ============================================================

-- ── Teste do Usuário A ─────────────────────────────────────
begin;
  -- Simula sessão autenticada do Usuário A
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',    'SUBSTITUIR-UUID-DO-USUARIO-A',
      'role',   'authenticated',
      'org_id', (select org_id from public.memberships where user_id = 'SUBSTITUIR-UUID-DO-USUARIO-A'::uuid)::text
    )::text,
    true
  );
  set local role authenticated;

  -- Deve retornar 1 (apenas Org Alpha)
  select 'Usuário A enxerga orgs (esperado: 1)' as teste, count(*) as resultado
    from public.organizations;

  -- Deve retornar 1 (apenas Planta Alpha)
  select 'Usuário A enxerga plantas (esperado: 1)' as teste, count(*) as resultado
    from public.plants;

  -- Deve retornar 1 (apenas próprio membership)
  select 'Usuário A enxerga memberships (esperado: 1)' as teste, count(*) as resultado
    from public.memberships;

  -- Tentativa de inserir planta na org alheia — deve retornar 0 linhas afetadas (RLS bloqueia)
  insert into public.plants (org_id, name)
  select id, 'Invasão A→B' from public.organizations where cnpj = '11.111.111/0001-11'
  on conflict do nothing;

  select 'Plantas invasoras (esperado: 0)' as teste, count(*) as resultado
    from public.plants where name = 'Invasão A→B';

rollback; -- rollback apenas para não deixar o role alterado

-- ── Teste do Usuário B ─────────────────────────────────────
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub',    'SUBSTITUIR-UUID-DO-USUARIO-B',
      'role',   'authenticated',
      'org_id', (select org_id from public.memberships where user_id = 'SUBSTITUIR-UUID-DO-USUARIO-B'::uuid)::text
    )::text,
    true
  );
  set local role authenticated;

  -- Deve retornar 1 (apenas Org Beta)
  select 'Usuário B enxerga orgs (esperado: 1)' as teste, count(*) as resultado
    from public.organizations;

  -- Deve retornar 1 (apenas Planta Beta)
  select 'Usuário B enxerga plantas (esperado: 1)' as teste, count(*) as resultado
    from public.plants;

  -- Tentativa de inserir planta na org do Usuário A — deve ser bloqueada
  insert into public.plants (org_id, name)
  select id, 'Invasão B→A' from public.organizations where cnpj = '00.000.000/0001-00'
  on conflict do nothing;

  select 'Plantas invasoras (esperado: 0)' as teste, count(*) as resultado
    from public.plants where name = 'Invasão B→A';

rollback;

-- ── Verificação cruzada como service_role (superuser) ──────
-- Deve enxergar TUDO (2 orgs, 2 plantas)
select 'Total de orgs (esperado: 2 de teste)' as teste, count(*) as resultado
  from public.organizations where cnpj in ('00.000.000/0001-00', '11.111.111/0001-11');

select 'Total de plantas (esperado: 2 de teste)' as teste, count(*) as resultado
  from public.plants where name in ('Planta Alpha 1', 'Planta Beta 1');

-- ============================================================
-- PASSO 3 — Limpar dados de teste
-- (rodar após confirmar o isolamento)
-- ============================================================

delete from public.organizations
where cnpj in ('00.000.000/0001-00', '11.111.111/0001-11');
-- As memberships, plantas e áreas são deletadas em cascade
