-- Migration 014: Adicionar CPF ao perfil para conformidade com Lei 14.063/2020
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuário para fins de assinatura digital e identificação oficial.';
