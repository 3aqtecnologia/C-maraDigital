-- ============================================================
-- Fix: admin_resetar_senha_tenant — suporte a tenants sem admin
-- ============================================================
-- Problema: tenants provisionados com a migration 002 (versão
-- original de provisionar_tenant) não criavam perfil de admin.
-- A função levantava "Nenhum administrador ativo encontrado"
-- mesmo para tenants válidos que apenas nunca tiveram admin.
--
-- A função agora trata 3 cenários:
--   1. Admin ativo encontrado       → reset de senha normal
--   2. Admin inativo encontrado     → reativa + reset de senha
--   3. Nenhum admin existe          → cria usuário auth + perfil + senha
-- ============================================================

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
  -- Verificar se quem chama é master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem realizar esta ação.';
  END IF;

  -- Gerar nova senha provisória
  v_senha := substring(md5(random()::text) from 1 for 6) || '@Cmr';

  -- ── Cenário 1: Admin ativo ──────────────────────────────────
  SELECT user_id, email INTO v_user_id, v_email
  FROM public.profiles
  WHERE tenant_id = p_tenant_id AND role = 'admin' AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- ── Cenário 2: Admin inativo (reativar) ────────────────────
  IF v_user_id IS NULL THEN
    SELECT user_id, email INTO v_user_id, v_email
    FROM public.profiles
    WHERE tenant_id = p_tenant_id AND role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET ativo = true
      WHERE tenant_id = p_tenant_id AND user_id = v_user_id;
    END IF;
  END IF;

  -- ── Cenário 3: Nenhum admin — criar do zero ─────────────────
  IF v_user_id IS NULL THEN
    -- Obter slug do tenant para compor o e-mail padrão
    SELECT slug INTO v_slug FROM public.tenants WHERE id = p_tenant_id;
    IF v_slug IS NULL THEN
      RAISE EXCEPTION 'Tenant não encontrado: %', p_tenant_id;
    END IF;

    v_email := 'admin@' || v_slug || '.leg.br';

    -- Verificar se já existe um auth.user com esse e-mail
    -- (pode ocorrer se o perfil foi deletado manualmente)
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      -- Criar usuário no auth.users
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_senha, gen_salt('bf')),
        NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', 'Administrador da Câmara'),
        NOW(), NOW()
      );

      -- Identity obrigatória do Supabase Auth
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        email, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb,
        'email',
        v_user_id::text,
        v_email,
        NOW(), NOW(), NOW()
      );
    END IF;

    -- Criar (ou reativar) perfil admin — usa ON CONFLICT pelo email único
    INSERT INTO public.profiles (tenant_id, user_id, nome, email, role, ativo)
    VALUES (p_tenant_id, v_user_id, 'Administrador da Câmara', v_email, 'admin', true)
    ON CONFLICT (tenant_id, email)
      DO UPDATE SET role = 'admin', ativo = true, user_id = EXCLUDED.user_id;

    v_criou_admin := true;
  END IF;

  -- ── Redefinir a senha no auth.users ─────────────────────────
  UPDATE auth.users
  SET encrypted_password = crypt(v_senha, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = v_user_id;

  -- ── Registrar no audit log ──────────────────────────────────
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    p_tenant_id,
    CASE WHEN v_criou_admin THEN 'admin_criado_e_senha_definida' ELSE 'reset_senha_admin' END,
    jsonb_build_object(
      'admin_email',  v_email,
      'user_id',      v_user_id,
      'admin_criado', v_criou_admin
    )
  );

  -- ── Retornar credenciais ────────────────────────────────────
  RETURN jsonb_build_object(
    'admin_email',    v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
