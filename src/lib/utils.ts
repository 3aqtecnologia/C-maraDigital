/**
 * Utilitários gerais do sistema
 */

/**
 * Mascara um CPF para o formato 123.***.***-45
 * @param cpf CPF completo ou parcial
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf || cpf === 'Não informado' || cpf.includes('#')) return '###.***.***-##'

  // Remove caracteres não numéricos
  const clean = cpf.replace(/\D/g, '')

  if (clean.length >= 11) {
    return `${clean.substring(0, 3)}.***.***-${clean.substring(clean.length - 2)}`
  }

  return '###.***.***-##'
}

/**
 * Formata data e hora para o padrão brasileiro
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

/**
 * Formata apenas a data para o padrão brasileiro
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}
