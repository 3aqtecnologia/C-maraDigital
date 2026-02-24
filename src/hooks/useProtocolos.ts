import { supabase } from '@/lib/supabase'
import type { Database, ProtocoloStatus, ProtocoloTipo } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type Protocolo = Database['public']['Tables']['protocolos']['Row']

export type { Protocolo, ProtocoloStatus, ProtocoloTipo }

export function useProtocolos() {
  const { profile } = useAuth()
  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProtocolos = useCallback(async (search = '', tipo = '', status = '') => {
    if (!profile?.tenant_id) return
    setLoading(true)

    let query = supabase
      .from('protocolos')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('ano', { ascending: false })
      .order('numero', { ascending: false })
      .limit(100)

    if (search) {
      query = query.or(`assunto.ilike.%${search}%,numero.ilike.%${search}%,remetente.ilike.%${search}%`)
    }
    if (tipo) {
      query = query.eq('tipo', tipo as ProtocoloTipo)
    }
    if (status) {
      query = query.eq('status', status as ProtocoloStatus)
    }

    const { data, error } = await query
    if (!error && data) setProtocolos(data as Protocolo[])
    setLoading(false)
  }, [profile?.tenant_id])

  async function proximoNumero(ano: number): Promise<string> {
    if (!profile?.tenant_id) return '0001'

    const { data, error } = await supabase.rpc('next_protocolo_numero', {
      p_tenant_id: profile.tenant_id,
      p_ano: ano,
    })

    if (error || typeof data !== 'string') return '0001'
    return data
  }

  async function criarProtocolo(payload: {
    tipo: ProtocoloTipo
    assunto: string
    remetente?: string
    destinatario?: string
    data_recebimento: string
    prazo?: string
    observacoes?: string
  }): Promise<{ error: string | null }> {
    if (!profile?.tenant_id) return { error: 'Sem permissão' }

    const ano = new Date(payload.data_recebimento).getFullYear()
    const numero = await proximoNumero(ano)

    const { error } = await supabase.from('protocolos').insert({
      tenant_id: profile.tenant_id,
      numero,
      ano,
      tipo: payload.tipo,
      assunto: payload.assunto,
      remetente: payload.remetente || null,
      destinatario: payload.destinatario || null,
      data_recebimento: payload.data_recebimento,
      prazo: payload.prazo || null,
      observacoes: payload.observacoes || null,
      criado_por: profile.id,
    })

    if (error) return { error: error.message }
    return { error: null }
  }

  async function atualizarStatus(
    id: string,
    status: ProtocoloStatus
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('protocolos')
      .update({ status })
      .eq('id', id)
      .eq('tenant_id', profile?.tenant_id ?? '')

    if (error) return { error: error.message }
    return { error: null }
  }

  async function deletarProtocolo(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('protocolos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile?.tenant_id ?? '')

    return !error
  }

  return { protocolos, loading, fetchProtocolos, criarProtocolo, atualizarStatus, deletarProtocolo }
}
