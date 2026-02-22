-- ============================================================
-- Migration 012: Fase 6 — GED, Teletrabalho e Protocolos
-- ============================================================

-- ── 1. Storage Bucket: documentos ────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Garante que o bucket seja visÃ­vel para as operaÃ§Ãµes de storage (evita "Bucket not found")
CREATE POLICY "Allow public select on buckets" ON storage.buckets FOR SELECT USING (true);

-- Storage RLS: upload (admins e servidores do tenant)
CREATE POLICY "Tenant staff can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'servidor')
        AND ativo = true
    )
  );

-- Storage RLS: visualizar (qualquer usuário do tenant)
CREATE POLICY "Tenant users can view their documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.profiles
      WHERE user_id = auth.uid() AND ativo = true
    )
  );

-- Storage RLS: deletar (apenas admins)
CREATE POLICY "Tenant admins can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );


-- ── 2. Tabela: documentos ─────────────────────────────────────

CREATE TYPE documento_tipo AS ENUM (
  'ata', 'oficio', 'requerimento', 'decreto',
  'contrato', 'portaria', 'outro'
);

CREATE TABLE IF NOT EXISTS public.documentos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tipo            documento_tipo NOT NULL DEFAULT 'outro',
  descricao       TEXT,
  arquivo_path    TEXT NOT NULL,
  arquivo_nome    TEXT NOT NULL,
  arquivo_tamanho BIGINT,
  arquivo_mime    TEXT,
  enviado_por     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios do tenant veem documentos"
  ON public.documentos FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid() AND ativo = true LIMIT 1
  ));

CREATE POLICY "Admins e servidores inserem documentos"
  ON public.documentos FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'servidor')
      AND ativo = true
    LIMIT 1
  ));

CREATE POLICY "Admins e servidores atualizam documentos"
  ON public.documentos FOR UPDATE
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'servidor')
      AND ativo = true
    LIMIT 1
  ));

CREATE POLICY "Admins deletam documentos"
  ON public.documentos FOR DELETE
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND ativo = true
    LIMIT 1
  ));

CREATE TRIGGER set_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 3. Tabela: teletrabalho_registros ─────────────────────────

CREATE TYPE teletrabalho_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

CREATE TABLE IF NOT EXISTS public.teletrabalho_registros (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data         DATE NOT NULL,
  hora_inicio  TIME,
  hora_fim     TIME,
  atividades   TEXT NOT NULL,
  status       teletrabalho_status NOT NULL DEFAULT 'pendente',
  obs_gestor   TEXT,
  aprovado_por UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, profile_id, data)
);

ALTER TABLE public.teletrabalho_registros ENABLE ROW LEVEL SECURITY;

-- Servidores veem apenas seus registros; admins veem todos do tenant
CREATE POLICY "Servidor ve registros"
  ON public.teletrabalho_registros FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles
      WHERE user_id = auth.uid() AND ativo = true LIMIT 1
    )
    AND (
      profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1)
      OR (SELECT role FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1) IN ('admin', 'servidor')
    )
  );

CREATE POLICY "Servidor insere seus registros"
  ON public.teletrabalho_registros FOR INSERT
  WITH CHECK (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1)
    AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1)
  );

CREATE POLICY "Servidor edita pendentes, admin edita todos"
  ON public.teletrabalho_registros FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles
      WHERE user_id = auth.uid() AND ativo = true LIMIT 1
    )
    AND (
      (
        profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1)
        AND status = 'pendente'
      )
      OR (SELECT role FROM public.profiles WHERE user_id = auth.uid() AND ativo = true LIMIT 1) = 'admin'
    )
  );

CREATE TRIGGER set_teletrabalho_updated_at
  BEFORE UPDATE ON public.teletrabalho_registros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 4. Tabela: protocolos ─────────────────────────────────────

CREATE TYPE protocolo_tipo AS ENUM ('entrada', 'saida');
CREATE TYPE protocolo_status AS ENUM ('pendente', 'em_tramitacao', 'concluido', 'arquivado');

CREATE TABLE IF NOT EXISTS public.protocolos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero           TEXT NOT NULL,
  ano              INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  tipo             protocolo_tipo NOT NULL,
  status           protocolo_status NOT NULL DEFAULT 'pendente',
  assunto          TEXT NOT NULL,
  remetente        TEXT,
  destinatario     TEXT,
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo            DATE,
  observacoes      TEXT,
  criado_por       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, numero, ano)
);

ALTER TABLE public.protocolos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios do tenant veem protocolos"
  ON public.protocolos FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid() AND ativo = true LIMIT 1
  ));

CREATE POLICY "Admins e servidores criam protocolos"
  ON public.protocolos FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'servidor')
      AND ativo = true
    LIMIT 1
  ));

CREATE POLICY "Admins e servidores atualizam protocolos"
  ON public.protocolos FOR UPDATE
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'servidor')
      AND ativo = true
    LIMIT 1
  ));

CREATE POLICY "Admins deletam protocolos"
  ON public.protocolos FOR DELETE
  USING (tenant_id = (
    SELECT tenant_id FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND ativo = true
    LIMIT 1
  ));

-- Função: próximo número sequencial de protocolo
CREATE OR REPLACE FUNCTION public.next_protocolo_numero(p_tenant_id UUID, p_ano INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN numero ~ '^\d+$' THEN numero::INTEGER ELSE 0 END
  ), 0) INTO v_max
  FROM public.protocolos
  WHERE tenant_id = p_tenant_id AND ano = p_ano;

  RETURN LPAD((v_max + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_protocolos_updated_at
  BEFORE UPDATE ON public.protocolos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
