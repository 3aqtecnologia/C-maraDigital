-- Migration: Ouvidoria e e-SIC (Transparência)
-- Descrição: Criação das tabelas de chamados e interações com cidadão, conforme Lei 12.527/2011 (LAI)

-- Enums
CREATE TYPE public.ouvidoria_tipo AS ENUM ('denuncia', 'reclamacao', 'solicitacao', 'sugestao', 'elogio', 'pedido_informacao');
CREATE TYPE public.ouvidoria_status AS ENUM ('novo', 'em_analise', 'respondido', 'concluido', 'arquivado');
CREATE TYPE public.ouvidoria_resposta_origem AS ENUM ('cidadao', 'servidor');

-- Tabela: ouvidoria_tickets
CREATE TABLE IF NOT EXISTS public.ouvidoria_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    protocolo VARCHAR(20) NOT NULL,
    tipo public.ouvidoria_tipo NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    status public.ouvidoria_status DEFAULT 'novo'::public.ouvidoria_status NOT NULL,
    cidadao_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Perfil Logado (Obrigatório LAI p/ e-SIC)
    sigiloso BOOLEAN DEFAULT false NOT NULL, -- Opção para denuncias com dados protegidos no portal interno
    prazo_vencimento TIMESTAMPTZ NOT NULL, -- Calculado na trigger (20 dias)
    prazo_prorrogado BOOLEAN DEFAULT false, -- Marca se +10 dias foram adicionados
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Restrições
    CONSTRAINT uq_ouvidoria_protocolo_tenant UNIQUE (tenant_id, protocolo)
);

-- Tabela: ouvidoria_mensagens (Chat no ticket)
CREATE TABLE IF NOT EXISTS public.ouvidoria_mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.ouvidoria_tickets(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES public.profiles(id), -- Quem enviou
    origem public.ouvidoria_resposta_origem NOT NULL, -- Se é do cidadão ou do servidor
    mensagem TEXT NOT NULL,
    anexo_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.ouvidoria_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouvidoria_mensagens ENABLE ROW LEVEL SECURITY;

-- Índice para busca e SLA
CREATE INDEX idx_ouvidoria_tickets_tenant ON public.ouvidoria_tickets(tenant_id);
CREATE INDEX idx_ouvidoria_tickets_cidadao ON public.ouvidoria_tickets(cidadao_id);
CREATE INDEX idx_ouvidoria_tickets_status_prazo ON public.ouvidoria_tickets(status, prazo_vencimento);
CREATE INDEX idx_ouvidoria_mensagens_ticket ON public.ouvidoria_mensagens(ticket_id);

-- Função de Geração de Protocolo
CREATE OR REPLACE FUNCTION public.next_ouvidoria_protocolo(p_tenant_id UUID, p_ano INTEGER)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq INTEGER;
    v_prefix VARCHAR(10) := 'OUV';
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.ouvidoria_tickets
    WHERE tenant_id = p_tenant_id AND EXTRACT(YEAR FROM created_at) = p_ano;

    v_seq := v_count + 1;
    RETURN v_prefix || '-' || p_ano::VARCHAR || '-' || LPAD(v_seq::VARCHAR, 5, '0');
END;
$$;

-- Trigger para calcular SLA inicial e Protocolo
CREATE OR REPLACE FUNCTION public.trg_ouvidoria_ticket_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Gera Protocolo se Vazio
    IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
        NEW.protocolo := public.next_ouvidoria_protocolo(NEW.tenant_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    END IF;

    -- SLA de 20 dias da LAI a partir do created_at
    IF NEW.prazo_vencimento IS NULL THEN
        NEW.prazo_vencimento := (COALESCE(NEW.created_at, NOW()) + INTERVAL '20 days');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ouvidoria_calcula_sla
    BEFORE INSERT ON public.ouvidoria_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_ouvidoria_ticket_before_insert();

-- Trigger de updated_at
CREATE TRIGGER trg_atualiza_ouvidoria_tickets_updated_at
    BEFORE UPDATE ON public.ouvidoria_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Políticas RLS: ouvidoria_tickets
-- Cidadão visualiza seus próprios tickets
CREATE POLICY "Cidadão ver seus próprios tickets" ON public.ouvidoria_tickets
    FOR SELECT USING (cidadao_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Cidadão cria tickets se identificar (Autenticado)
CREATE POLICY "Cidadão pode criar chamados" ON public.ouvidoria_tickets
    FOR INSERT WITH CHECK (
        tenant_id = public.get_user_tenant_id() AND
        public.get_user_role() IN ('cidadao', 'servidor', 'admin')
    );

-- Servidores / Admins do Backoffice visualizam todos do mesmo tenant
CREATE POLICY "Servidores veem tickets do tenant" ON public.ouvidoria_tickets
    FOR SELECT USING (
        tenant_id = public.get_user_tenant_id() AND
        public.get_user_role() IN ('admin', 'servidor')
    );

-- Servidores atualizam (Apenas status, prazo_prorrogado)
CREATE POLICY "Servidores atualizam tickets" ON public.ouvidoria_tickets
    FOR UPDATE USING (
        tenant_id = public.get_user_tenant_id() AND
        public.get_user_role() IN ('admin', 'servidor')
    );

-- Políticas RLS: ouvidoria_mensagens
-- Cidadão ou Servidor veem as mensagens do ticket
CREATE POLICY "Visualização de mensagens" ON public.ouvidoria_mensagens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ouvidoria_tickets t
            WHERE t.id = ticket_id AND
            (
                t.cidadao_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
                (t.tenant_id = public.get_user_tenant_id() AND public.get_user_role() IN ('admin', 'servidor'))
            )
        )
    );

-- Cidadão envia mensagem em tickets não arquivados/concluidos do próprio ticket
CREATE POLICY "Cidadão envia mensagem" ON public.ouvidoria_mensagens
    FOR INSERT WITH CHECK (
        origem = 'cidadao' AND
        EXISTS (
            SELECT 1 FROM public.ouvidoria_tickets t
            WHERE t.id = ticket_id AND
            t.status NOT IN ('concluido', 'arquivado') AND
            t.cidadao_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- Servidor envia mensagem para o ticket
CREATE POLICY "Servidor envia mensagem" ON public.ouvidoria_mensagens
    FOR INSERT WITH CHECK (
        origem = 'servidor' AND
        tenant_id = public.get_user_tenant_id() AND
        public.get_user_role() IN ('admin', 'servidor') AND
        EXISTS (
            SELECT 1 FROM public.ouvidoria_tickets t
            WHERE t.id = ticket_id AND t.tenant_id = public.get_user_tenant_id()
        )
    );
