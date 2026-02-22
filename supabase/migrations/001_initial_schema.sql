-- ============================================================
-- CâmaraDigital - Schema Inicial (Multi-tenant)
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'vereador', 'servidor', 'executivo', 'cidadao');
CREATE TYPE proposicao_tipo AS ENUM (
  'projeto_lei', 'projeto_lei_complementar', 'projeto_resolucao',
  'requerimento', 'indicacao', 'moca_aplausos', 'voto_pesar'
);
CREATE TYPE proposicao_status AS ENUM (
  'rascunho', 'protocolado', 'em_tramitacao', 'em_comissao',
  'em_votacao', 'aprovado', 'rejeitado', 'arquivado', 'sancionado', 'vetado'
);
CREATE TYPE voto_opcao AS ENUM ('sim', 'nao', 'abstencao', 'ausente');
CREATE TYPE sessao_tipo AS ENUM ('ordinaria', 'extraordinaria', 'especial', 'solene');
CREATE TYPE sessao_status AS ENUM ('agendada', 'em_andamento', 'encerrada', 'cancelada');

-- ============================================================
-- TABELA: tenants (Câmaras Municipais)
-- ============================================================

CREATE TABLE public.tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  municipio   TEXT NOT NULL,
  uf          CHAR(2) NOT NULL,
  cnpj        TEXT UNIQUE,
  slug        TEXT UNIQUE NOT NULL,  -- ex: "camara-municipio-sp"
  logo_url    TEXT,
  cor_primaria TEXT NOT NULL DEFAULT '#1e3a5f',
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: profiles (Usuários por tenant)
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'servidor',
  avatar_url  TEXT,
  partido     TEXT,   -- para vereadores
  matricula   TEXT,   -- para servidores
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id),
  UNIQUE(tenant_id, email)
);

-- ============================================================
-- TABELA: proposicoes
-- ============================================================

CREATE TABLE public.proposicoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero          TEXT NOT NULL,   -- ex: "012"
  ano             INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  tipo            proposicao_tipo NOT NULL,
  ementa          TEXT NOT NULL,
  texto_integral  TEXT,
  autor_id        UUID NOT NULL REFERENCES public.profiles(id),
  status          proposicao_status NOT NULL DEFAULT 'rascunho',
  data_protocolo  DATE NOT NULL DEFAULT CURRENT_DATE,
  data_publicacao DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, tipo, numero, ano)
);

-- Sequência automática de numeração por tipo/ano/tenant via função
CREATE OR REPLACE FUNCTION next_proposicao_numero(p_tenant_id UUID, p_tipo proposicao_tipo, p_ano INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.proposicoes
  WHERE tenant_id = p_tenant_id AND tipo = p_tipo AND ano = p_ano;
  RETURN LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABELA: tramitacoes (histórico de tramitação)
-- ============================================================

CREATE TABLE public.tramitacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposicao_id   UUID NOT NULL REFERENCES public.proposicoes(id) ON DELETE CASCADE,
  status_anterior proposicao_status,
  status_novo     proposicao_status NOT NULL,
  descricao       TEXT,
  responsavel_id  UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: sessoes
-- ============================================================

CREATE TABLE public.sessoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero          INTEGER NOT NULL,
  ano             INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  tipo            sessao_tipo NOT NULL DEFAULT 'ordinaria',
  status          sessao_status NOT NULL DEFAULT 'agendada',
  data_inicio     TIMESTAMPTZ NOT NULL,
  data_fim        TIMESTAMPTZ,
  local           TEXT NOT NULL DEFAULT 'Plenário da Câmara Municipal',
  quorum_minimo   INTEGER NOT NULL DEFAULT 1,
  presentes       UUID[] NOT NULL DEFAULT '{}',
  transmissao_url TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero, ano)
);

-- ============================================================
-- TABELA: pauta_itens (Ordem do dia)
-- ============================================================

CREATE TABLE public.pauta_itens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sessao_id       UUID NOT NULL REFERENCES public.sessoes(id) ON DELETE CASCADE,
  proposicao_id   UUID NOT NULL REFERENCES public.proposicoes(id),
  ordem           INTEGER NOT NULL,
  em_votacao      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: votos (IMUTÁVEL - sem UPDATE/DELETE)
-- ============================================================

CREATE TABLE public.votos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sessao_id       UUID NOT NULL REFERENCES public.sessoes(id),
  proposicao_id   UUID NOT NULL REFERENCES public.proposicoes(id),
  vereador_id     UUID NOT NULL REFERENCES public.profiles(id),
  opcao           voto_opcao NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sessao_id, proposicao_id, vereador_id)
);

-- Trigger para impedir UPDATE/DELETE em votos (RN02)
CREATE OR REPLACE FUNCTION prevent_vote_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Votos são imutáveis e não podem ser alterados ou excluídos.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER votos_immutable_update
  BEFORE UPDATE ON public.votos
  FOR EACH ROW EXECUTE FUNCTION prevent_vote_modification();

CREATE TRIGGER votos_immutable_delete
  BEFORE DELETE ON public.votos
  FOR EACH ROW EXECUTE FUNCTION prevent_vote_modification();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - RN01
-- ============================================================

ALTER TABLE public.tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pauta_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos       ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna o tenant_id do usuário logado
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função auxiliar: retorna o role do usuário logado
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- POLICIES: profiles
CREATE POLICY "profiles_tenant_isolation" ON public.profiles
  USING (tenant_id = auth.user_tenant_id());

-- POLICIES: proposicoes
CREATE POLICY "proposicoes_tenant_isolation" ON public.proposicoes
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "proposicoes_insert" ON public.proposicoes
  FOR INSERT WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND auth.user_role() IN ('vereador', 'servidor', 'admin')
  );

CREATE POLICY "proposicoes_update" ON public.proposicoes
  FOR UPDATE USING (
    tenant_id = auth.user_tenant_id()
    AND auth.user_role() IN ('servidor', 'admin')
  );

-- POLICIES: tramitacoes
CREATE POLICY "tramitacoes_tenant_isolation" ON public.tramitacoes
  USING (tenant_id = auth.user_tenant_id());

-- POLICIES: sessoes
CREATE POLICY "sessoes_tenant_isolation" ON public.sessoes
  USING (tenant_id = auth.user_tenant_id());

-- POLICIES: pauta_itens
CREATE POLICY "pauta_itens_tenant_isolation" ON public.pauta_itens
  USING (tenant_id = auth.user_tenant_id());

-- POLICIES: votos
CREATE POLICY "votos_tenant_isolation" ON public.votos
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "votos_insert_vereador" ON public.votos
  FOR INSERT WITH CHECK (
    tenant_id = auth.user_tenant_id()
    AND vereador_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND auth.user_role() = 'vereador'
  );

-- ============================================================
-- UPDATED_AT trigger automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tenants     BEFORE UPDATE ON public.tenants     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_profiles    BEFORE UPDATE ON public.profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_proposicoes BEFORE UPDATE ON public.proposicoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_sessoes     BEFORE UPDATE ON public.sessoes     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
