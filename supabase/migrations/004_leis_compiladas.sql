-- ============================================================
-- Funcionalidade: LeisGov (Compilação de Leis)
-- ============================================================

CREATE TYPE lei_status AS ENUM ('em_vigor', 'revogada_parcialmente', 'revogada_totalmente');

CREATE TABLE public.leis (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposicao_id   UUID REFERENCES public.proposicoes(id) ON DELETE SET NULL, -- Referência à origem (opcional)
  numero          TEXT NOT NULL,
  ano             INTEGER NOT NULL,
  esfera          TEXT NOT NULL DEFAULT 'Municipal', -- Pode ser Lei Orgânica, Lei Ordinária, Lei Complementar
  ementa          TEXT NOT NULL,
  texto_compilado TEXT NOT NULL,
  status          lei_status NOT NULL DEFAULT 'em_vigor',
  data_publicacao DATE NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, numero, ano)
);

-- Habilitar RLS
ALTER TABLE public.leis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "leis_tenant_isolation" ON public.leis
  USING (tenant_id = public.get_user_tenant_id() OR public.is_master_admin());

CREATE POLICY "leis_select" ON public.leis
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id() OR public.is_master_admin()
  );

CREATE POLICY "leis_insert" ON public.leis
  FOR INSERT WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'servidor')
  );

CREATE POLICY "leis_update" ON public.leis
  FOR UPDATE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin', 'servidor')
  );

CREATE POLICY "leis_delete" ON public.leis
  FOR DELETE USING (
    tenant_id = public.get_user_tenant_id()
    AND public.get_user_role() IN ('admin')
  );

-- Trigger de updated_at
CREATE TRIGGER set_updated_at_leis
  BEFORE UPDATE ON public.leis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
