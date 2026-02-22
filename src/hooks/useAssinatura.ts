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
  const assinarDocumento = useCallback(async (documentoId: string) => {
    if (!profile?.tenant_id || !user?.id) return { error: 'Usuário não autenticado' }

    setLoading(true)

    try {
      // 1. Cria o registro da intenção de assinatura
      const { data: signatureReq, error: reqError } = await supabase
        .from('assinaturas')
        .insert({
          tenant_id: profile.tenant_id,
          documento_id: documentoId,
          user_id: user.id,
          status: 'pendente'
        })
        .select()
        .single()

      if (reqError) throw new Error(reqError.message)

      // 2. Simula o "Handshake" com a API de Assinatura (Gov.br)
      // Aqui o usuário seria enviado para o Gov.br e voltaria com um token.
      // Vamos simular um delay e o sucesso da operação.
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. Confirmar a assinatura (O backend do Gov.br faria este callback em prod)
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({
          status: 'assinado',
          token: `govbr_simulated_${crypto.randomUUID()}`,
          signed_at: new Date().toISOString()
        })
        .eq('id', signatureReq.id)

      if (updateError) throw new Error(updateError.message)

      return { error: null }
    } catch (err: any) {
      return { error: err.message }
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
