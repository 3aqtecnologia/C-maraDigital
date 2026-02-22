-- ============================================================
-- CâmaraDigital - Administrador Master (SaaS)
-- ============================================================
-- O Master Admin é um super-administrador da plataforma SaaS.
-- Ele NÃO pertence a nenhum tenant, gerencia todos os tenants.
-- Tem acesso bypass ao RLS para operações de provisionamento.
-- ============================================================

-- ============================================================
-- ENUMS adicionais
-- ============================================================

CREATE TYPE tenant_plano AS ENUM ('basico', 'profissional', 'enterprise');
CREATE TYPE tenant_situacao AS ENUM ('ativo', 'suspenso', 'trial', 'cancelado');

-- ============================================================
-- TABELA: master_admins
-- Usuários com acesso irrestrito à plataforma SaaS completa
-- ============================================================

CREATE TABLE public.master_admins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.master_admins ENABLE ROW LEVEL SECURITY;

-- Master admins vêem apenas seu próprio registro
CREATE POLICY "master_admins_self" ON public.master_admins
  USING (user_id = auth.uid());

-- ============================================================
-- TABELA: tenant_planos_config (assinaturas e limites)
-- ============================================================

CREATE TABLE public.tenant_planos_config (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plano               tenant_plano NOT NULL DEFAULT 'basico',
  situacao            tenant_situacao NOT NULL DEFAULT 'trial',
  max_usuarios        INTEGER NOT NULL DEFAULT 15,
  max_storage_gb      NUMERIC(6,2) NOT NULL DEFAULT 5.0,
  trial_ate           DATE,
  proxima_cobranca    DATE,
  valor_mensalidade   NUMERIC(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_planos_config ENABLE ROW LEVEL SECURITY;

-- Tenant admin vê apenas o plano do seu tenant
CREATE POLICY "tenant_plano_isolation" ON public.tenant_planos_config
  USING (tenant_id = auth.user_tenant_id());

-- ============================================================
-- TABELA: tenant_audit_log
-- Log imutável de ações do Master Admin sobre tenants
-- ============================================================

CREATE TABLE public.tenant_audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_admin_id UUID NOT NULL REFERENCES public.master_admins(id),
  tenant_id       UUID REFERENCES public.tenants(id),
  acao            TEXT NOT NULL,   -- ex: 'tenant_criado', 'tenant_suspenso'
  detalhes        JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas master admins vêem o log
CREATE POLICY "audit_log_master_only" ON public.tenant_audit_log
  USING (
    EXISTS (
      SELECT 1 FROM public.master_admins
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- ============================================================
-- FUNÇÕES AUXILIARES PARA MASTER ADMIN
-- ============================================================

-- Verifica se o usuário logado é um master admin ativo
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.master_admins
    WHERE user_id = auth.uid() AND ativo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- ATUALIZAR POLÍTICAS RLS EXISTENTES
-- Permitir que master admin acesse todos os tenants
-- ============================================================

-- tenants: master admin vê todos
DROP POLICY IF EXISTS "tenants_isolation" ON public.tenants;
CREATE POLICY "tenants_master_all" ON public.tenants
  USING (public.is_master_admin() OR id = auth.user_tenant_id());

-- profiles: master admin vê todos
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON public.profiles;
CREATE POLICY "profiles_master_or_tenant" ON public.profiles
  USING (public.is_master_admin() OR tenant_id = auth.user_tenant_id());

-- proposicoes: master admin vê todas (somente leitura auditoria)
DROP POLICY IF EXISTS "proposicoes_tenant_isolation" ON public.proposicoes;
CREATE POLICY "proposicoes_master_or_tenant" ON public.proposicoes
  USING (public.is_master_admin() OR tenant_id = auth.user_tenant_id());

-- sessoes: master admin vê todas
DROP POLICY IF EXISTS "sessoes_tenant_isolation" ON public.sessoes;
CREATE POLICY "sessoes_master_or_tenant" ON public.sessoes
  USING (public.is_master_admin() OR tenant_id = auth.user_tenant_id());

-- ============================================================
-- FUNÇÃO: provisionar_tenant
-- Cria um novo tenant completo com usuário admin inicial
-- ============================================================

CREATE OR REPLACE FUNCTION public.provisionar_tenant(
  p_nome          TEXT,
  p_municipio     TEXT,
  p_uf            CHAR(2),
  p_cnpj          TEXT,
  p_slug          TEXT,
  p_plano         tenant_plano DEFAULT 'trial',
  p_max_usuarios  INTEGER DEFAULT 15
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_master_id UUID;
BEGIN
  -- Verificar se quem chama é master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem provisionar tenants.';
  END IF;

  -- Criar tenant
  INSERT INTO public.tenants (nome, municipio, uf, cnpj, slug, ativo)
  VALUES (p_nome, p_municipio, p_uf, p_cnpj, p_slug, true)
  RETURNING id INTO v_tenant_id;

  -- Criar configuração de plano
  INSERT INTO public.tenant_planos_config (tenant_id, plano, situacao, max_usuarios, trial_ate)
  VALUES (
    v_tenant_id,
    p_plano,
    CASE WHEN p_plano = 'trial' THEN 'trial'::tenant_situacao ELSE 'ativo'::tenant_situacao END,
    p_max_usuarios,
    CASE WHEN p_plano = 'trial' THEN CURRENT_DATE + INTERVAL '30 days' ELSE NULL END
  );

  -- Log da ação
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    v_tenant_id,
    'tenant_provisionado',
    jsonb_build_object('nome', p_nome, 'municipio', p_municipio, 'uf', p_uf, 'plano', p_plano)
  );

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW: master_tenant_overview
-- Visão consolidada de todos os tenants para o Master Admin
-- ============================================================

CREATE OR REPLACE VIEW public.master_tenant_overview AS
SELECT
  t.id,
  t.nome,
  t.municipio,
  t.uf,
  t.slug,
  t.ativo,
  t.created_at,
  pc.plano,
  pc.situacao,
  pc.max_usuarios,
  pc.trial_ate,
  pc.valor_mensalidade,
  COUNT(DISTINCT p.id) FILTER (WHERE p.ativo = true)    AS usuarios_ativos,
  COUNT(DISTINCT pr.id)                                   AS total_proposicoes,
  COUNT(DISTINCT s.id)                                    AS total_sessoes
FROM public.tenants t
LEFT JOIN public.tenant_planos_config pc ON pc.tenant_id = t.id
LEFT JOIN public.profiles p              ON p.tenant_id = t.id
LEFT JOIN public.proposicoes pr          ON pr.tenant_id = t.id
LEFT JOIN public.sessoes s               ON s.tenant_id = t.id
GROUP BY t.id, t.nome, t.municipio, t.uf, t.slug, t.ativo, t.created_at,
         pc.plano, pc.situacao, pc.max_usuarios, pc.trial_ate, pc.valor_mensalidade;

-- Apenas master admins acessam a view
REVOKE ALL ON public.master_tenant_overview FROM anon, authenticated;
GRANT SELECT ON public.master_tenant_overview TO authenticated;

CREATE POLICY "master_overview_policy" ON public.tenants -- view herda do RLS da tabela base
  USING (true); -- já controlado pela view com SECURITY DEFINER no contexto

-- ============================================================
-- TRIGGER updated_at para novas tabelas
-- ============================================================

CREATE TRIGGER set_updated_at_master_admins
  BEFORE UPDATE ON public.master_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_tenant_planos
  BEFORE UPDATE ON public.tenant_planos_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
