-- ============================================================
-- Funcionalidade Master: Deletar Tenant Completo
-- ============================================================
-- Exclui permanentemente um tenant e TODOS os dados associados:
--   • Registros de todas as tabelas do tenant (via CASCADE)
--   • Usuários no auth.users (e suas identities)
--   • Entradas do audit log são preservadas com tenant_id = NULL
--
-- Permissão: exclusivo para Master Admins (is_master_admin()).
-- Esta ação é IRREVERSÍVEL.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_deletar_tenant(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_master_id   UUID;
  v_nome_tenant TEXT;
  v_user_ids    UUID[];
  v_total_users INTEGER;
BEGIN
  -- 1. Apenas master admin pode executar
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem deletar tenants.';
  END IF;

  -- 2. Verificar que o tenant existe
  SELECT nome INTO v_nome_tenant
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF v_nome_tenant IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado: %', p_tenant_id;
  END IF;

  -- 3. Coletar user_ids do tenant (exceto master admins que
  --    possam ter perfis de impersonação aqui)
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_user_ids
  FROM public.profiles
  WHERE tenant_id = p_tenant_id
    AND user_id NOT IN (SELECT user_id FROM public.master_admins);

  v_total_users := COALESCE(array_length(v_user_ids, 1), 0);

  -- 4. Obter id do master admin logado (para o log)
  SELECT id INTO v_master_id
  FROM public.master_admins
  WHERE user_id = auth.uid();

  -- 5. Nullificar tenant_id nos audit logs existentes deste tenant.
  --    O FK em tenant_audit_log.tenant_id é RESTRICT por padrão —
  --    sem este UPDATE o DELETE do tenant seria bloqueado.
  UPDATE public.tenant_audit_log
  SET tenant_id = NULL
  WHERE tenant_id = p_tenant_id;

  -- 6. Deletar o tenant (ON DELETE CASCADE cuida de:
  --    profiles, proposicoes, tramitacoes, sessoes,
  --    pauta_itens, votos, leis, tenant_planos_config)
  DELETE FROM public.tenants WHERE id = p_tenant_id;

  -- 7. Registrar a exclusão no audit log
  --    (tenant_id = NULL pois o registro foi deletado)
  INSERT INTO public.tenant_audit_log
    (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    NULL,
    'tenant_deletado',
    jsonb_build_object(
      'tenant_id_deletado',      p_tenant_id,
      'nome_tenant',             v_nome_tenant,
      'total_usuarios_removidos', v_total_users
    )
  );

  -- 8. Deletar usuários do auth (identities e users).
  --    auth.sessions e auth.refresh_tokens são removidos via CASCADE
  --    pelo próprio Supabase ao deletar auth.users.
  IF v_user_ids IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = ANY(v_user_ids);
    DELETE FROM auth.users      WHERE id       = ANY(v_user_ids);
  END IF;

  RETURN jsonb_build_object(
    'status',                 'deletado',
    'tenant_id',              p_tenant_id,
    'nome_tenant',            v_nome_tenant,
    'usuarios_removidos',     v_total_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
