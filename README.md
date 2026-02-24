# 🏛️ CâmaraDigital — Plataforma SaaS de Gestão Legislativa

Plataforma SaaS 100% em nuvem para modernizar e automatizar a gestão de **Câmaras Municipais brasileiras**. Foco em desmaterialização (papel zero), eficiência operacional e cumprimento rigoroso das leis de transparência pública (LAI, LGPD, LRF).

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js v18+
- Conta no [Supabase](https://supabase.com/)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/3aqtecnologia/C-maraDigital.git
cd C-maraDigital

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
```

Preencha `.env.local` com suas credenciais Supabase:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

```bash
# 4. Aplique as migrações em supabase/migrations/ (ordem numérica)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

---

## ✨ Funcionalidades Implementadas

### 👑 Administrador Master (SaaS)
- Painel exclusivo em `/master` — isolado do backoffice das câmaras
- **Provisionar nova Câmara:** formulário com nome, município, UF, CNPJ, slug, plano e e-mail administrativo customizado.
- **Geração Automática de Credenciais:** o sistema gera automaticamente e-mail padrão e senha forte aleatória no provisionamento, facilitando o primeiro acesso do cliente.
- **Gestão de Câmaras:** modal administrativo com edição de dados em tempo real, controle dinâmico do Slug Base (subdomínio dinâmico via URL linkável) e controle de Lifecycle do cliente (Status: Ativo, Trial, Suspenso e Cancelado).
- **Reset de Senha Mestre (Hard Reset):** funcionalidade para resetar remotamente a senha do administrador da câmara em caso de perda total de acesso, com geração de nova credencial provisória e log de auditoria.
- **Configurações Globais:** edição dinâmica de limites e recursos dos planos de assinatura (Básico, Profissional, Enterprise), segurança com MFA e whitelist IP, e outras permissões.
- **Representação Autenticada (Impersonation):** impersonation validada no banco antes do redirecionamento — previne acesso a tenants inexistentes.
- **Audit Log:** histórico de ações administrativas com filtros.
- **Dashboard Master:** visão geral de todas as câmaras com hiperlinks espertos para filtragem automática e isolamento na visualização.
- **Forçar Troca de Senha:** garantia de segurança que obriga o administrador a definir uma senha definitiva no primeiro acesso ou após um reset mestre.
- **Notificações Toast:** feedback visual não-bloqueante substitui `alert()` nativo em todas as ações do painel master.

### 📋 Módulo Legislativo
- **Lista de Proposições** com filtros por status e busca por número/ementa/tipo
- **Nova Proposição:** seleção de tipo (PL, PLC, PR, REQ, IND, MOC, VP), ementa e texto integral
  - Editor Rico (TipTap) embutido nativamente para formatação profissional de Diário Oficial
  - Salvar como rascunho ou protocolar imediatamente (recebe número oficial)
- **Detalhe da Proposição:** metadados, texto integral e **timeline de tramitação**
  - Transições de status com histórico imutável
- **Compilação de Leis (LeisGov):** gestão de leis municipais/estaduais vigentes
  - Cadastro com ementas e texto compilado via TipTap
  - Listagem com filtros de busca e visualização estilizada tipo "Diário Oficial"
  - Controle de status (Em Vigor, Revogada Parcial/Total)

### 🏛️ Módulo Plenário (Tempo Real)
- Vereador: voto eletrônico — **SIM / NÃO / ABSTENÇÃO** — imutável via trigger no banco
- **Transmissão:** suporte a URL de vídeo com player integrado no painel.

### 🌐 Portal da Transparência (Público)
- Visualização pública de proposições, leis e sessões — sem necessidade de login.
- **Ouvidoria / e-SIC:** sistema de tickets para denúncias, reclamações e pedidos de informação com SLA de 20 dias (Lei 12.527/2011).
- **Exportação em Dados Abertos:** download de leis e proposições em **CSV** (compatível com Excel, BOM UTF-8) e **JSON** diretamente no portal.
- **Resolução Inteligente de Tenant:** detecção via subdomínio (produção), query param (`?slug=`) ou fallback automático para o primeiro tenant ativo (ambiente de teste local sem sessão).

### 📁 Módulo Administrativo (GED & Processos)
- **GED (Gestão Eletrônica de Documentos):** sistema de arquivos com upload via Supabase Storage, categorização por tipo (Ata, Ofício, Portaria, etc.) e isolamento total por Câmara.
- **Protocolo Externo:** registro e rastreamento de entrada e saída de documentos com numeração seqüencial anual e controle de status.
- **Teletrabalho:** registro de atividades diárias, controle de jornada remota e fluxo de aprovação por gestores.

### 🔐 Autenticação & Multi-tenant
- Login único com redirecionamento automático (master → `/master`, tenant → `/backoffice`)
- Row Level Security (RLS) no PostgreSQL — isolamento total entre câmaras.
- **Recuperação de Senha (Self-service):** fluxo completo via e-mail para usuários redefinirem suas senhas com segurança.
- **Sanitização de Dados Auth:** normalização do banco de dados para evitar erros de processamento em instâncias legadas de tokens nulos no Supabase.
- Funções auxiliares no schema `public`: `get_user_tenant_id()`, `get_user_role()`, `is_master_admin()`.

### ⚡ Performance & Resiliência
- **Code-splitting com React.lazy:** todas as 26 páginas carregadas sob demanda — bundle inicial reduzido de 1,1 MB para **497 KB (−55%)**.
- **AuthProvider com React Context:** estado de autenticação compartilhado em memória com uma única assinatura Supabase para toda a aplicação. Mutex `useRef` previne race condition em `resolveUserType`.
- **Error Boundary global:** tela de fallback amigável com botão "Tentar novamente" — exceções em páginas não mais causam tela branca.
- **Página 404:** rota catch-all com links de retorno para o início e o portal público.
- **Paginação defensiva:** `.limit(100)` em todos os hooks de listagem — previne OOM em câmaras com grande volume de dados.
- **Dashboard resiliente:** `safeRun` com timeout de 8 s por query — o dashboard carrega parcialmente mesmo se uma consulta falhar ou demorar.
- **PWA com Workbox runtime caching:** `NetworkFirst` para a API Supabase (10 s timeout) e `CacheFirst` para assets estáticos — funciona offline com dados recentes em cache.

### ♿ Acessibilidade & UX Mobile
- **Sidebar responsiva:** hambúrguer no mobile abre a sidebar com transição suave e overlay de fechamento — layout funcional em telas < 768 px.
- **ARIA completo nos modais:** `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-label` e focus trap automático em todos os 4 modais da aplicação (Upload, Certificado, Gov.br, Protocolo).
- **Toast system:** notificações não-bloqueantes com auto-dismiss (4 s) e ícones por tipo (sucesso/erro/info) — sem `alert()` nativo no código.

### 🧱 Qualidade de Código
- **Logger wrapper:** `src/lib/logger.ts` — logs suprimidos em produção, ativos apenas em desenvolvimento.
- **Tipos RPC:** `src/types/rpc.ts` — interfaces TypeScript para todas as funções RPC admin (elimina `as any`).
- **Modais extraídos:** `Documentos.tsx` reduzido de 719 para ~200 linhas; 3 modais movidos para `src/pages/backoffice/documentos/`.

---

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| UI e Texto Rico | TailwindCSS, Tailwind Typography, TipTap |
| Roteamento | React Router v7 |
| Ícones | Lucide React |
| Backend (BaaS) | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| PWA | vite-plugin-pwa (offline-first) |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/           # LoginPage, ForgotPasswordPage, ResetPasswordPage
│   ├── layout/         # AppLayout (sidebar mobile + hamburger), Sidebar, PageHeader
│   ├── master/         # MasterLayout (com Suspense + ErrorBoundary)
│   └── ui/             # ErrorBoundary, PageLoader, Toast
├── contexts/
│   ├── AuthContext.tsx       # AuthProvider + AuthContext (1 assinatura Supabase global)
│   └── ToastContext.tsx      # ToastProvider + sistema de notificações
├── hooks/
│   ├── useAuth.ts            # Re-exporta useAuth() do AuthContext
│   ├── useToast.ts           # Hook para exibir toasts
│   ├── useProposicoes.ts     # CRUD proposições + tramitações
│   ├── useDashboard.ts       # Queries com safeRun (timeout + fallback)
│   └── useSessoes.ts         # Sessões + votação em tempo real
├── lib/
│   ├── supabase.ts           # Cliente Supabase tipado
│   └── logger.ts             # Logger wrapper (silenciado em produção)
├── pages/
│   ├── backoffice/
│   │   ├── documentos/       # UploadModal, CertificateModal, GovBrSignatureModal
│   │   └── …                 # 17 páginas (Dashboard, Legislativo, Plenário, GED, Ouvidoria…)
│   ├── master/               # 5 páginas (MasterDashboard, ProvisionarCamara, AuditLog…)
│   ├── transparencia/        # 4 páginas (PortalPublico, detalhe público, Verificador)
│   └── NotFound.tsx          # Página 404 com catch-all route
├── routes/
│   ├── index.tsx         # Rotas com React.lazy (code-splitting) + Suspense
│   ├── AuthGuard.tsx     # Proteção de rotas tenant (valida session + userType)
│   └── MasterGuard.tsx
└── types/
    ├── database.ts       # Tipagem completa do schema Supabase
    └── rpc.ts            # Interfaces TypeScript para RPCs admin
supabase/
└── migrations/
    ├── 001_initial_schema.sql    # Tabelas, enums, RLS, triggers
    └── 002_master_admin.sql      # Master admin, planos, provisioning
```

---

## 🗂️ Perfis de Usuário

| Role | Acesso |
|------|--------|
| `master` | Painel `/master` — gestão global da plataforma |
| `admin` | Backoffice completo — gestão da câmara |
| `servidor` | Backoffice — operação legislativa |
| `vereador` | Backoffice — votação eletrônica no plenário |
| `executivo` | Visualização + proposições do executivo |
| `cidadao` | Portal da Transparência |

---

## 🗺️ Roadmap

- [x] Fase 1 — Scaffold: Vite + React + TailwindCSS + Supabase + PWA
- [x] Fase 2 — Master Admin: provisionamento de câmaras, audit log, planos
- [x] Fase 3 — Módulo Legislativo: CRUD, tramitação, timeline
- [x] Fase 4 — Plenário: sessões, votação eletrônica em tempo real
- [x] Fase 5 — Administrativo & GED: upload de arquivos, teletrabalho e protocolo
- [x] Fase 6 — Segurança Avançada: assinatura digital (ICP-Brasil) e verificação de QR Code
- [x] Fase 7 — Portal da Transparência: visualização pública e ouvidoria (e-SIC)
- [x] Fase 7 — Portal da Transparência: exportação de dados abertos (CSV, JSON)
- [x] Melhorias — Code-splitting (React.lazy), AuthProvider, Error Boundary e página 404
- [x] Melhorias — Toast system, logger, tipos RPC, paginação defensiva, sidebar mobile, ARIA, dashboard resiliente, PWA workbox

---

## 📝 Convenção de Commits

Desenvolvimento documentado em **Português do Brasil (pt-BR)** seguindo Conventional Commits:

```
feat: adicionar módulo de votação eletrônica
fix: corrigir cálculo de quórum
docs: atualizar README com roadmap
refactor: reorganizar hooks de sessão
```

---

## 📄 Licença

Uso proprietário — © 3AQ Tecnologia. Todos os direitos reservados.
