-- ============================================================
-- CâmaraDigital — Fase 8: Personalização por Câmara
-- Visual (logo, cores, contato) + Ritos Legislativos
-- (tipos de proposição, tipos de sessão, fluxo de tramitação)
-- ============================================================

-- ============================================================
-- 1. Novas colunas de identidade visual e contato em tenants
-- ============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cor_secundaria      TEXT    DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS endereco            TEXT,
  ADD COLUMN IF NOT EXISTS telefone            TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp            TEXT,
  ADD COLUMN IF NOT EXISTS email_geral         TEXT,
  ADD COLUMN IF NOT EXISTS site_url            TEXT,
  ADD COLUMN IF NOT EXISTS horario_atendimento TEXT;

-- ============================================================
-- 2. Converter colunas de enum para TEXT (tipos dinâmicos)
--    Permite que cada câmara use seus próprios tipos
-- ============================================================

ALTER TABLE public.proposicoes ALTER COLUMN tipo TYPE TEXT;
ALTER TABLE public.sessoes     ALTER COLUMN tipo TYPE TEXT;

-- ============================================================
-- 3. Tabela: tenant_tipos_proposicao
--    Tipos de proposição configuráveis por câmara
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_tipos_proposicao (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo     TEXT        NOT NULL,   -- chave interna, ex: 'projeto_lei'
  nome       TEXT        NOT NULL,   -- ex: 'Projeto de Lei'
  sigla      TEXT        NOT NULL,   -- ex: 'PL'
  ativo      BOOLEAN     NOT NULL DEFAULT true,
  ordem      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

-- ============================================================
-- 4. Tabela: tenant_tipos_sessao
--    Tipos de sessão configuráveis por câmara
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_tipos_sessao (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome              TEXT        NOT NULL,   -- ex: 'Sessão Ordinária'
  descricao         TEXT,
  quorum_percentual INTEGER     DEFAULT 51,
  ativo             BOOLEAN     NOT NULL DEFAULT true,
  ordem             INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, nome)
);

-- ============================================================
-- 5. Tabela: tenant_fluxo_tramitacao
--    Etapas e transições de tramitação configuráveis por câmara
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_fluxo_tramitacao (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status_codigo   TEXT        NOT NULL,              -- código interno único por tenant
  label           TEXT        NOT NULL,              -- rótulo exibido, ex: 'Em análise na Mesa'
  cor             TEXT        NOT NULL DEFAULT '#6b7280',
  proximos_status JSONB       NOT NULL DEFAULT '[]', -- array de status_codigo permitidos
  ordem           INTEGER     NOT NULL DEFAULT 0,
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, status_codigo)
);

-- ============================================================
-- 6. Row Level Security
-- ============================================================

ALTER TABLE public.tenant_tipos_proposicao  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_tipos_sessao      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_fluxo_tramitacao  ENABLE ROW LEVEL SECURITY;

-- tenant_tipos_proposicao
CREATE POLICY "ttp_select" ON public.tenant_tipos_proposicao
  FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR public.is_master_admin());

CREATE POLICY "ttp_admin_write" ON public.tenant_tipos_proposicao
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- tenant_tipos_sessao
CREATE POLICY "tts_select" ON public.tenant_tipos_sessao
  FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR public.is_master_admin());

CREATE POLICY "tts_admin_write" ON public.tenant_tipos_sessao
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- tenant_fluxo_tramitacao
CREATE POLICY "tft_select" ON public.tenant_fluxo_tramitacao
  FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR public.is_master_admin());

CREATE POLICY "tft_admin_write" ON public.tenant_fluxo_tramitacao
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- 7. Função seed_tenant_defaults
--    Pré-popula tipos padrão para uma câmara nova ou existente
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_tenant_defaults(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Tipos de proposição padrão (7 tipos legislativos comuns)
  INSERT INTO public.tenant_tipos_proposicao
    (tenant_id, codigo, nome, sigla, ordem)
  VALUES
    (p_tenant_id, 'projeto_lei',                'Projeto de Lei',                  'PL',  1),
    (p_tenant_id, 'projeto_lei_complementar',   'Projeto de Lei Complementar',     'PLC', 2),
    (p_tenant_id, 'projeto_resolucao',          'Projeto de Resolução',            'PR',  3),
    (p_tenant_id, 'requerimento',               'Requerimento',                    'REQ', 4),
    (p_tenant_id, 'indicacao',                  'Indicação',                       'IND', 5),
    (p_tenant_id, 'moca_aplausos',              'Moção de Aplausos',               'MOC', 6),
    (p_tenant_id, 'voto_pesar',                 'Voto de Pesar',                   'VP',  7)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;

  -- Tipos de sessão padrão (4 tipos regimentais comuns)
  INSERT INTO public.tenant_tipos_sessao
    (tenant_id, nome, descricao, quorum_percentual, ordem)
  VALUES
    (p_tenant_id, 'Sessão Ordinária',     'Sessões regulares previstas no calendário anual', 51, 1),
    (p_tenant_id, 'Sessão Extraordinária','Convocada fora do calendário regular',            51, 2),
    (p_tenant_id, 'Sessão Especial',      'Para deliberação de assuntos específicos',        51, 3),
    (p_tenant_id, 'Sessão Solene',        'Cerimônias, homenagens e comemorações',            1, 4)
  ON CONFLICT (tenant_id, nome) DO NOTHING;

  -- Fluxo de tramitação padrão (10 etapas com transições permitidas)
  INSERT INTO public.tenant_fluxo_tramitacao
    (tenant_id, status_codigo, label, cor, proximos_status, ordem)
  VALUES
    (p_tenant_id, 'rascunho',      'Rascunho',        '#9ca3af', '["protocolado"]',                    1),
    (p_tenant_id, 'protocolado',   'Protocolado',     '#3b82f6', '["em_tramitacao","arquivado"]',       2),
    (p_tenant_id, 'em_tramitacao', 'Em Tramitação',   '#f59e0b', '["em_comissao","em_votacao","arquivado"]', 3),
    (p_tenant_id, 'em_comissao',   'Em Comissão',     '#8b5cf6', '["em_votacao","arquivado"]',          4),
    (p_tenant_id, 'em_votacao',    'Em Votação',      '#ec4899', '["aprovado","rejeitado"]',            5),
    (p_tenant_id, 'aprovado',      'Aprovado',        '#10b981', '["sancionado","vetado"]',             6),
    (p_tenant_id, 'rejeitado',     'Rejeitado',       '#ef4444', '["arquivado"]',                       7),
    (p_tenant_id, 'sancionado',    'Sancionado',      '#059669', '[]',                                  8),
    (p_tenant_id, 'vetado',        'Vetado',          '#dc2626', '["arquivado"]',                       9),
    (p_tenant_id, 'arquivado',     'Arquivado',       '#6b7280', '[]',                                 10)
  ON CONFLICT (tenant_id, status_codigo) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Seed para todos os tenants já existentes
-- ============================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_tenant_defaults(r.id);
  END LOOP;
END $$;

-- ============================================================
-- 9. Atualizar provisionar_tenant para incluir seed
-- ============================================================

CREATE OR REPLACE FUNCTION public.provisionar_tenant(
  p_nome          TEXT,
  p_municipio     TEXT,
  p_uf            CHAR(2),
  p_cnpj          TEXT,
  p_slug          TEXT,
  p_plano         tenant_plano DEFAULT 'basico',
  p_max_usuarios  INTEGER DEFAULT 15,
  p_admin_nome    TEXT DEFAULT 'Administrador da Câmara'
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_master_id UUID;
  v_user_id   UUID;
  v_email     TEXT;
  v_senha     TEXT;
BEGIN
  -- Verificar se quem chama é master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem provisionar tenants.';
  END IF;

  -- Gerar credenciais do administrador inicial
  v_email := 'admin@' || p_slug || '.leg.br';
  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- Criar tenant
  INSERT INTO public.tenants (nome, municipio, uf, cnpj, slug, ativo)
  VALUES (p_nome, p_municipio, p_uf, p_cnpj, p_slug, true)
  RETURNING id INTO v_tenant_id;

  -- Seed dos tipos e fluxo padrão
  PERFORM public.seed_tenant_defaults(v_tenant_id);

  -- Criar configuração de plano
  INSERT INTO public.tenant_planos_config (tenant_id, plano, situacao, max_usuarios, trial_ate)
  VALUES (
    v_tenant_id,
    p_plano,
    'ativo'::tenant_situacao,
    p_max_usuarios,
    CURRENT_DATE + INTERVAL '30 days'
  );

  -- Log da ação
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    v_tenant_id,
    'tenant_provisionado_com_admin',
    jsonb_build_object('nome', p_nome, 'slug', p_slug, 'admin_email', v_email)
  );

  -- Criar o usuário administrador no Supabase Auth
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
    crypt(v_senha, gen_salt('bf')), NOW(),
    NOW(), '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_admin_nome),
    NOW(), NOW()
  );

  -- Inserir Identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, email, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
    'email', v_user_id::text, v_email, NOW(), NOW(), NOW()
  );

  -- Inserir Perfil do Admin
  INSERT INTO public.profiles (
    tenant_id, user_id, nome, email, role, ativo
  ) VALUES (
    v_tenant_id, v_user_id, p_admin_nome, v_email, 'admin', true
  );

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'admin_email', v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
