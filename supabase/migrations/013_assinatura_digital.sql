-- ============================================================
-- Migration 013: Módulo de Assinatura Digital (ICP-Brasil / GOV.BR)
-- ============================================================

-- 1. Enum para status de assinatura
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assinatura_status') THEN
        CREATE TYPE assinatura_status AS ENUM ('pendente', 'assinado', 'falhou', 'cancelado');
    END IF;
END $$;

-- 2. Adicionar coluna 'assinado' em documentos
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS assinado BOOLEAN DEFAULT false;

-- 3. Tabela de controle de assinaturas (Backend-simulated para Gov.br)
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  documento_id     UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  status           assinatura_status NOT NULL DEFAULT 'pendente',
  token            TEXT, -- Token do OAuth2/Gov.br
  signed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Assinaturas
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios do tenant veem suas assinaturas"
  ON public.assinaturas FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid() AND ativo = true LIMIT 1
  ));

CREATE POLICY "Usuarios podem criar pedidos de assinatura"
  ON public.assinaturas FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid() AND ativo = true LIMIT 1
  ));

CREATE POLICY "Sistema/Admin atualiza assinaturas"
  ON public.assinaturas FOR UPDATE
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid() AND ativo = true LIMIT 1
  ));

-- 4. Função para marcar documento como assinado automaticamente
CREATE OR REPLACE FUNCTION public.confirmar_assinatura_documento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'assinado' AND OLD.status != 'assinado' THEN
        UPDATE public.documentos
        SET assinado = true, updated_at = NOW()
        WHERE id = NEW.documento_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_confirmar_assinatura
AFTER UPDATE ON public.assinaturas
FOR EACH ROW EXECUTE FUNCTION public.confirmar_assinatura_documento();

-- 5. Configuração PostgREST
NOTIFY pgrst, 'reload schema';
