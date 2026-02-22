-- ============================================================
-- Funcionalidade Master: Reset de Senha do Admin da Câmara
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_resetar_senha_tenant(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_master_id UUID;
  v_user_id   UUID;
  v_email     TEXT;
  v_senha     TEXT;
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

  -- 3. Atualizar a senha no auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(v_senha, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = v_user_id;

  -- 4. Registrar log da ação
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    p_tenant_id,
    'reset_senha_admin',
    jsonb_build_object('admin_email', v_email, 'user_id', v_user_id)
  );

  -- 5. Retornar os novos dados
  RETURN jsonb_build_object(
    'admin_email', v_email,
    'admin_password', v_senha
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
