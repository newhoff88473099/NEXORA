# NEXORA

Plataforma SaaS de auditorias, inspeções e conformidade industrial. Substitui planilha e papel por um fluxo digital completo: criação de checklists, execução de auditorias (inclusive em campo, via tablet/celular), registro de não conformidades, planos de ação, relatórios em PDF e um assistente de IA que ajuda a redigir descrições, causa raiz e checklists.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** — Postgres, Auth e Storage (fotos de evidência, assinaturas, PDFs)
- **Stripe** — assinaturas e billing
- **Tailwind CSS 4** + **shadcn/ui** sobre **Base UI** — design system próprio (paleta industrial, tokens semânticos de conformidade)
- **Anthropic API** — geração assistida de checklists, descrições de NC e análise de causa raiz (5 Porquês)
- `@dnd-kit`, `@react-pdf/renderer`, `recharts`, `react-hook-form` + `zod`

## Estrutura do produto

- **Auditorias** — agendamento, execução (checklist por seção, fotos com anotação, assinatura do auditado, cálculo de score) e histórico
- **Checklists (templates)** — editor com seções/itens reordenáveis por drag-and-drop, versionamento, biblioteca de modelos compartilhados e geração assistida por IA
- **Não conformidades** — severidade, causa raiz (5 Porquês), vínculo com ações corretivas/preventivas/de contenção
- **Ações** — plano de ação com responsável, prazo e evidências
- **Relatórios** — exportação em PDF por auditoria e visão consolidada por período
- **Billing** — planos via Stripe, trial e portal de gerenciamento de assinatura

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com as credenciais do seu projeto Supabase e Stripe:

```bash
cp .env.local.example .env.local
```

Variáveis usadas pela aplicação:

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (nunca expor no client) |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (necessária só para rodar migrations) |
| `NEXT_PUBLIC_SITE_URL` | URL pública da aplicação (usada em magic link / convites) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` | IDs dos preços (`price_...`) de cada plano no Stripe |
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `ANTHROPIC_MODEL` | Opcional — padrão `claude-haiku-4-5-20251001` |

### 3. Rodar as migrations do banco

```bash
node db/migrate.js
```

Aplica os arquivos em `db/migrations/` em ordem (fundação de schema, templates, auditorias, IA, relatórios, billing, trial).

### 4. Subir o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Em ambiente de desenvolvimento, `/dev-login` permite entrar como usuário de teste sem passar pelo fluxo de login completo.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |

## Estrutura do código

```
src/
  app/
    (app)/          # Área autenticada: dashboard, auditorias, templates, NCs, ações, relatórios, configurações
    (marketing)/     # Landing page pública
    api/             # Rotas de API (IA, PDF, webhook do Stripe)
    login/ onboarding/ produto/ia/
  components/
    audit/           # Widgets de execução de auditoria (fotos, assinatura, NC)
    dashboard/       # Gráficos
    marketing/       # Seções da landing page
    ui/              # Design system (shadcn/Base UI)
  lib/               # Clientes Supabase/Stripe, prompts de IA, utils
db/
  migrations/        # Migrations SQL, aplicadas via db/migrate.js
```
