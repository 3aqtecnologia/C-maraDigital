import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type Assinatura = Database['public']['Tables']['assinaturas']['Row']

export function useAssinatura() {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(false)

  /**
   * Simulação de integração com Gov.br / ICP-Brasil
   * Em produção, isso redirecionaria para o fluxo OAuth2 do Gov.br
   */
  const assinarDocumento = useCallback(async (documentoId: string, nivel_govbr: 'Prata' | 'Ouro' = 'Prata') => {
    if (!profile?.tenant_id || !user?.id) return { error: 'Usuário não autenticado' }

    setLoading(true)

    try {
      // Chamada para a Edge Function real que calcula o HASH do arquivo e valida
      const { data, error: fnError } = await supabase.functions.invoke('sign-document', {
        body: { documento_id: documentoId, nivel_govbr }
      })

      if (fnError) throw new Error(fnError.message)
      if (data.error) throw new Error(data.error)

      return { error: null }
    } catch (err) {
      console.error('Erro na assinatura:', err)
      return { error: err instanceof Error ? err.message : String(err) }
    } finally {
      setLoading(false)
    }
  }, [profile, user])

  const verificarStatus = useCallback(async (documentoId: string) => {
    const { data, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('documento_id', documentoId)
      .eq('status', 'assinado')
      .maybeSingle()

    return { data: data as Assinatura, error }
  }, [])

  return { loading, assinarDocumento, verificarStatus }
}
