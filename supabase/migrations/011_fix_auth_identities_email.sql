-- ============================================================
-- Fix: remover coluna "email" do INSERT em auth.identities
-- ============================================================
-- No Supabase atual, auth.identities.email é uma coluna
-- GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED.
-- Inserir um valor explícito nessa coluna causa:
--   "cannot insert a non-DEFAULT value into column 'email'"
--
-- Funções corrigidas:
--   • provisionar_tenant        (reescreve a versão de migration 007)
--   • admin_resetar_senha_tenant (reescreve a versão de migration 009)
-- ============================================================

-- ── 1. provisionar_tenant ────────────────────────────────────

DROP FUNCTION IF EXISTS public.provisionar_tenant(TEXT, TEXT, CHAR(2), TEXT, TEXT, tenant_plano, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.provisionar_tenant(
  p_nome          TEXT,
  p_municipio     TEXT,
  p_uf            CHAR(2),
  p_cnpj          TEXT,
  p_slug          TEXT,
  p_plano         tenant_plano DEFAULT 'basico',
  p_max_usuarios  INTEGER DEFAULT 15,
  p_admin_nome    TEXT DEFAULT 'Administrador da Câmara',
  p_admin_email   TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_master_id UUID;
  v_user_id   UUID;
  v_email     TEXT;
  v_senha     TEXT;
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem provisionar tenants.';
  END IF;

  -- E-mail: usa o fornecido ou gera padrão
  IF p_admin_email IS NOT NULL AND trim(p_admin_email) != '' THEN
    v_email := trim(p_admin_email);
  ELSE
    v_email := 'admin@' || p_slug || '.leg.br';
  END IF;

  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- Tenant
  INSERT INTO public.tenants (nome, municipio, uf, cnpj, slug, ativo)
  VALUES (p_nome, p_municipio, p_uf, p_cnpj, p_slug, true)
  RETURNING id INTO v_tenant_id;

  -- Plano
  INSERT INTO public.tenant_planos_config (tenant_id, plano, situacao, max_usuarios, trial_ate)
  VALUES (v_tenant_id, p_plano, 'ativo'::tenant_situacao, p_max_usuarios, CURRENT_DATE + INTERVAL '30 days');

  -- Audit log
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (v_master_id, v_tenant_id, 'tenant_provisionado_com_admin',
          jsonb_build_object('nome', p_nome, 'slug', p_slug, 'admin_email', v_email));

  -- Auth user
  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
    crypt(v_senha, gen_salt('bf')), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_admin_nome),
    NOW(), NOW()
  );

  -- Identity — sem a coluna "email" (é gerada automaticamente)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
    'email', v_user_id::text,
    NOW(), NOW(), NOW()
  );

  -- Perfil admin
  INSERT INTO public.profiles (tenant_id, user_id, nome, email, role, ativo)
  VALUES (v_tenant_id, v_user_id, p_admin_nome, v_email, 'admin', true);

  RETURN jsonb_build_object(
    'tenant_id',      v_tenant_id,
    'admin_email',    v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. admin_resetar_senha_tenant ────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_resetar_senha_tenant(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_master_id   UUID;
  v_user_id     UUID;
  v_email       TEXT;
  v_senha       TEXT;
  v_slug        TEXT;
  v_criou_admin BOOLEAN := false;
BEGIN
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem realizar esta ação.';
  END IF;

  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- Cenário 1: admin ativo
  SELECT user_id, email INTO v_user_id, v_email
  FROM public.profiles
  WHERE tenant_id = p_tenant_id AND role = 'admin' AND ativo = true
  ORDER BY created_at ASC LIMIT 1;

  -- Cenário 2: admin inativo → reativar
  IF v_user_id IS NULL THEN
    SELECT user_id, email INTO v_user_id, v_email
    FROM public.profiles
    WHERE tenant_id = p_tenant_id AND role = 'admin'
    ORDER BY created_at ASC LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      UPDATE public.profiles SET ativo = true
      WHERE tenant_id = p_tenant_id AND user_id = v_user_id;
    END IF;
  END IF;

  -- Cenário 3: nenhum admin → criar do zero
  IF v_user_id IS NULL THEN
    SELECT slug INTO v_slug FROM public.tenants WHERE id = p_tenant_id;
    IF v_slug IS NULL THEN
      RAISE EXCEPTION 'Tenant não encontrado: %', p_tenant_id;
    END IF;

    v_email := 'admin@' || v_slug || '.leg.br';

    -- Verificar se já existe um auth.user com esse e-mail
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
        crypt(v_senha, gen_salt('bf')), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Administrador da Câmara"}',
        NOW(), NOW()
      );

      -- Identity — sem a coluna "email" (é gerada automaticamente)
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
        'email', v_user_id::text,
        NOW(), NOW(), NOW()
      );
    END IF;

    INSERT INTO public.profiles (tenant_id, user_id, nome, email, role, ativo)
    VALUES (p_tenant_id, v_user_id, 'Administrador da Câmara', v_email, 'admin', true)
    ON CONFLICT (tenant_id, email)
      DO UPDATE SET role = 'admin', ativo = true, user_id = EXCLUDED.user_id;

    v_criou_admin := true;
  END IF;

  -- Redefinir senha
  UPDATE auth.users
  SET encrypted_password = crypt(v_senha, gen_salt('bf')), updated_at = NOW()
  WHERE id = v_user_id;

  -- Audit log
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id, p_tenant_id,
    CASE WHEN v_criou_admin THEN 'admin_criado_e_senha_definida' ELSE 'reset_senha_admin' END,
    jsonb_build_object('admin_email', v_email, 'user_id', v_user_id, 'admin_criado', v_criou_admin)
  );

  RETURN jsonb_build_object(
    'admin_email',    v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
