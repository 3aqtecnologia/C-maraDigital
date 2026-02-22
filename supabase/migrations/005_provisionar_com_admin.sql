-- ============================================================
-- Atualização: Função provisionar_tenant para gerar Admin Local
-- ============================================================

-- Dropar versão antiga que retornava UUID
DROP FUNCTION IF EXISTS public.provisionar_tenant(TEXT, TEXT, CHAR(2), TEXT, TEXT, tenant_plano, INTEGER);

-- Recriar função retornando JSONB contendo credenciais
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
  -- Gerar uma senha aleatoria de 8 caracteres alfanumericos
  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- Criar tenant
  INSERT INTO public.tenants (nome, municipio, uf, cnpj, slug, ativo)
  VALUES (p_nome, p_municipio, p_uf, p_cnpj, p_slug, true)
  RETURNING id INTO v_tenant_id;

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

  -- ===============================================
  -- CRIAR O USUÁRIO ADMINISTRADOR NO SUPABASE AUTH
  -- ===============================================
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

  -- Inserir Identity (Requirement do Supabase)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, email, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb, 'email', v_user_id::text, v_email, NOW(), NOW(), NOW()
  );

  -- Inserir Perfil do Admin no schema public
  INSERT INTO public.profiles (
    tenant_id, user_id, nome, email, role, ativo
  ) VALUES (
    v_tenant_id, v_user_id, p_admin_nome, v_email, 'admin', true
  );

  -- Retornar os dados
  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'admin_email', v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
