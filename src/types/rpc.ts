// Tipos para funções RPC do painel Master Admin
// O Supabase JS v2 não gera tipos automáticos para RPCs — estes garantem type-safety nas chamadas

export interface AdminDeletarTenantParams {
  p_tenant_id: string
}
export interface AdminDeletarTenantResult {
  nome_tenant: string
  usuarios_removidos: number
}

export interface AdminResetarSenhaParams {
  p_tenant_id: string
}
export interface AdminResetarSenhaResult {
  nova_senha: string
  email_admin: string
}

export interface AdminUpdateTenantParams {
  p_tenant_id: string
  p_nome?: string
  p_municipio?: string
  p_uf?: string
  p_slug?: string
  p_status?: string
  p_plano?: string
  p_situacao?: string
  p_url_base?: string
}
export interface AdminUpdateTenantResult {
  success: boolean
}
