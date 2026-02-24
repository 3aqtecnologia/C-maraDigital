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
- **Representação Autenticada (Impersonation):** função de acessar áreas restritas do tenant via painel Mestre com faixa de alerta para suporte técnico rápido.
- **Audit Log:** histórico de ações administrativas com filtros.
- **Dashboard Master:** visão geral de todas as câmaras com hiperlinks espertos para filtragem automática e isolamento na visualização.
- **Forçar Troca de Senha:** garantia de segurança que obriga o administrador a definir uma senha definitiva no primeiro acesso ou após um reset mestre.

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
│   ├── auth/           # LoginPage
│   ├── layout/         # AppLayout, Sidebar, PageHeader
│   └── master/         # MasterLayout
├── hooks/
│   ├── useAuth.ts            # Autenticação + resolução de tipo de usuário
│   ├── useProposicoes.ts     # CRUD proposições + tramitações
│   └── useSessoes.ts         # Sessões + votação em tempo real
├── lib/
│   └── supabase.ts           # Cliente Supabase tipado
├── pages/
│   ├── backoffice/
│   │   ├── Dashboard.tsx
│   │   ├── Legislativo.tsx         # Lista de proposições
│   │   ├── ProposicaoNova.tsx      # Formulário de criação
│   │   ├── ProposicaoDetalhe.tsx   # Detalhe + timeline de tramitação
│   │   ├── LeisList.tsx            # Lista de leis compiladas (LeisGov)
│   │   ├── LeiNova.tsx             # Cadastro de nova lei
│   │   ├── LeiDetalhe.tsx          # Detalhe estilizado da lei
│   │   ├── Plenario.tsx            # Lista de sessões + criação
│   │   └── PlenarioAtivo.tsx       # Painel ao vivo (Realtime)
│   ├── master/
│   │   ├── MasterDashboard.tsx
│   │   ├── ProvisionarCamara.tsx
│   │   └── AuditLog.tsx
│   └── transparencia/
│       └── PortalPublico.tsx
├── routes/
│   ├── index.tsx         # Definição de todas as rotas
│   ├── AuthGuard.tsx     # Proteção de rotas tenant
│   └── MasterGuard.tsx
└── types/
    └── database.ts       # Tipagem completa do schema Supabase
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
