# CâmaraDigital - Plataforma SaaS de Gestão Legislativa e Administrativa

Plataforma SaaS (Software as a Service) 100% em nuvem, concebida para modernizar e automatizar a gestão de Câmaras Municipais. O foco principal é a desmaterialização (papel zero), a eficiência operacional e o cumprimento rigoroso das leis de transparência pública.

## 🚀 Quick Start

### Pré-requisitos
- Node.js (v18+)
- Conta no [Supabase](https://supabase.com/)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/3aqtecnologia/C-maraDigital.git
cd C-maraDigital
```

2. Instale as dependências:
```bash
npm install
```

3. Instancie o banco de dados (Supabase):
Rode as migrações SQL localizadas na pasta `supabase/migrations/` no seu projeto Supabase.

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```
Preencha `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

5. Rode o projeto em ambiente de desenvolvimento:
```bash
npm run dev
```

## ✨ Features

- **Multi-tenant architecture:** Isolamento garantido via Row Level Security (RLS) no PostgreSQL.
- **Protocolo Digital:** Cadastro, tramitação e histórico de proposições.
- **Painel de Plenário & Votação Eletrônica:** Quórum, oradores, e painel em tempo real integrado a um app mobile (Votei.app style) para registro inalterável de votos.
- **Administrativo & GED (Gestão Eletrônica de Documentos):** Preparação de documentos para Assinatura Web baseada em Gov.br/ICP-Brasil com verificador de autenticidade (QR Code + Carimbo).
- **Portal da Transparência:** Sistema de Dados Abertos e ouvidoria atualizado automaticamente.
- **PWA Ready:** Suporte para acessibilidade via Celular/Tablet como PWA offline-first (em construção).

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, Vite, TypeScript, TailwindCSS, React Router, Phosphor Icons (Lucide)
- **Backend (BaaS):** Supabase (PostgreSQL, Auth, Storage)

## 📁 Estrutura do Projeto

- `/src/pages/` - As telas do sistema, divididas por contexto (`backoffice`, `plenario`, `transparencia`).
- `/src/components/` - Componentes React reutilizáveis.
- `/src/lib/` - Configurações utilitárias (Ex: Cliente do Supabase).
- `/src/types/` - Tipagens e definições do schema de dados.
- `/supabase/migrations/` - Os arquivos `.sql` de criação de esquema, políticas (RLS) e triggers.

## 📄 Licença

Uso proprietário - 3AQ Tecnologia.
