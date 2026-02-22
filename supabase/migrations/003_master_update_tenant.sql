-- ============================================================
-- FUNÇÃO: admin_update_tenant
-- Atualiza os dados de identificação e assinatura de um tenant
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_tenant(
  p_tenant_id UUID,
  p_nome TEXT,
  p_municipio TEXT,
  p_uf CHAR(2),
  p_slug TEXT,
  p_plano tenant_plano,
  p_situacao tenant_situacao
)
RETURNS VOID AS $$
DECLARE
  v_master_id UUID;
BEGIN
  -- Verificar se quem chama é master admin
  IF NOT public.is_master_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master Admins podem editar tenants.';
  END IF;

  -- 1. Atualizar base do tenant
  UPDATE public.tenants
  SET nome = p_nome,
      municipio = p_municipio,
      uf = p_uf,
      slug = p_slug,
      ativo = (p_situacao IN ('ativo', 'trial'))
  WHERE id = p_tenant_id;

  -- 2. Atualizar plano e situação
  UPDATE public.tenant_planos_config
  SET plano = p_plano,
      situacao = p_situacao
  WHERE tenant_id = p_tenant_id;

  -- 3. Log da ação
  SELECT id INTO v_master_id FROM public.master_admins WHERE user_id = auth.uid();
  INSERT INTO public.tenant_audit_log (master_admin_id, tenant_id, acao, detalhes)
  VALUES (
    v_master_id,
    p_tenant_id,
    'tenant_atualizado',
    jsonb_build_object('novo_status', p_situacao, 'novo_plano', p_plano, 'nome', p_nome)
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
