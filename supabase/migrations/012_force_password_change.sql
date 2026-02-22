-- ============================================================
-- Funcionalidade: Forçar Troca de Senha (First Access / Reset)
-- ============================================================

-- 1. Atualizar admin_resetar_senha_tenant para incluir o flag
CREATE OR REPLACE FUNCTION public.admin_resetar_senha_tenant(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_master_id UUID;
  v_user_id   UUID;
  v_email     TEXT;
  v_senha     TEXT;
  v_meta      JSONB;
BEGIN
  -- Verificar se quem chama é master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem realizar esta ação.';
  END IF;

  -- 1. Encontrar o perfil do administrador principal do Tenant
  SELECT user_id, email INTO v_user_id, v_email
  FROM public.profiles
  WHERE tenant_id = p_tenant_id AND role = 'admin' AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum administrador ativo encontrado para esta câmara.';
  END IF;

  -- 2. Gerar nova senha aleatória
  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- 3. Obter metadados atuais e adicionar flag
  SELECT raw_user_meta_data INTO v_meta FROM auth.users WHERE id = v_user_id;
  v_meta := COALESCE(v_meta, '{}'::jsonb) || jsonb_build_object('force_password_change', true);

  -- 4. Atualizar a senha e o flag no auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(v_senha, gen_salt('bf')),
      raw_user_meta_data = v_meta,
      updated_at = NOW()
  WHERE id = v_user_id;

  -- 5. Registrar log da ação
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    p_tenant_id,
    'reset_senha_admin',
    jsonb_build_object('admin_email', v_email, 'user_id', v_user_id)
  );

  -- 6. Retornar os novos dados
  RETURN jsonb_build_object(
    'admin_email', v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atualizar provisionar_tenant para incluir o flag no admin inicial
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

  -- Criar configuração de plano
  INSERT INTO public.tenant_planos_config (tenant_id, plano, situacao, max_usuarios, trial_ate)
  VALUES (v_tenant_id, p_plano, 'ativo'::tenant_situacao, p_max_usuarios, CURRENT_DATE + INTERVAL '30 days');

  -- Log
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (v_master_id, v_tenant_id, 'tenant_provisionado_com_admin', jsonb_build_object('nome', p_nome, 'slug', p_slug, 'admin_email', v_email));

  -- Criar usuário com force_password_change = true
  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
    crypt(v_senha, gen_salt('bf')), NOW(),
    NOW(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', p_admin_nome, 'force_password_change', true),
    NOW(), NOW()
  );

  -- Identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, email, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb, 'email', v_user_id::text, v_email, NOW(), NOW(), NOW()
  );

  -- Perfil
  INSERT INTO public.profiles (tenant_id, user_id, nome, email, role, ativo)
  VALUES (v_tenant_id, v_user_id, p_admin_nome, v_email, 'admin', true);

  RETURN jsonb_build_object('tenant_id', v_tenant_id, 'admin_email', v_email, 'admin_password', v_senha);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
