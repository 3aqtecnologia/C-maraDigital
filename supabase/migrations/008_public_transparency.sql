-- ============================================================
-- Migração: Transparência Pública (Acesso sem Login)
-- ============================================================

-- 1. Tenants: Permitir leitura pública de dados básicos para identificação
CREATE POLICY "tenants_public_read" ON public.tenants
  FOR SELECT USING (ativo = true);

-- 2. Leis: Todas as leis são públicas
CREATE POLICY "leis_public_read" ON public.leis
  FOR SELECT USING (true);

-- 3. Proposições: Públicas exceto rascunhos
CREATE POLICY "proposicoes_public_read" ON public.proposicoes
  FOR SELECT USING (status != 'rascunho');

-- 4. Tramitações: Públicas se a proposição for pública
CREATE POLICY "tramitacoes_public_read" ON public.tramitacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.proposicoes
      WHERE id = tramitacoes.proposicao_id
      AND status != 'rascunho'
    )
  );

-- 5. Sessões: Públicas
CREATE POLICY "sessoes_public_read" ON public.sessoes
  FOR SELECT USING (true);

-- 6. Pauta Itens: Públicos
CREATE POLICY "pauta_itens_public_read" ON public.pauta_itens
  FOR SELECT USING (true);

-- 7. Perfis (Profiles): Permitir leitura pública de dados básicos (Autor, Responsável)
-- Isso é necessário para mostrar o nome do autor nas proposições
CREATE POLICY "profiles_public_read_basic" ON public.profiles
  FOR SELECT USING (true);
