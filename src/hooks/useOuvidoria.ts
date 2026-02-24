import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

export type OuvidoriaTicket = Database['public']['Tables']['ouvidoria_tickets']['Row']
export type OuvidoriaMensagem = Database['public']['Tables']['ouvidoria_mensagens']['Row']

export function useOuvidoria() {
  const [tickets, setTickets] = useState<OuvidoriaTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { profile } = useAuth()

  const fetchTickets = useCallback(async () => {
    if (!profile?.tenant_id || !profile) return

    setLoading(true)
    setError(null)
    try {
      // O RLS já se encarrega de filtrar o que o perfil pode ver
      // Cidadão verá só os dele, admin verá todos do tenant
      const { data, error: fetchError } = await supabase
        .from('ouvidoria_tickets')
        .select('*')
        .eq('tenant_id', profile.tenant_id!)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTickets(data || [])
    } catch (err: unknown) {
      console.error('Erro ao buscar tickets:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [profile])

  const addTicket = async (ticket: Pick<OuvidoriaTicket, 'assunto' | 'descricao' | 'tipo' | 'sigiloso'>) => {
    if (!profile?.tenant_id || !profile) return { error: 'Sessão inválida' }

    setLoading(true)
    try {
      const { data, error: insertError } = await supabase
        .from('ouvidoria_tickets')
        .insert({
          ...ticket,
          tenant_id: profile.tenant_id!,
          cidadao_id: profile.id,
          status: 'novo',
        })
        .select()
        .single()

      if (insertError) throw insertError
      return { data }
    } catch (err: unknown) {
      console.error('Erro ao criar ticket:', err)
      return { error: err instanceof Error ? err.message : String(err) }
    } finally {
      setLoading(false)
    }
  }

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    addTicket
  }
}

export function useOuvidoriaDetalhe(ticketId?: string) {
  const [ticket, setTicket] = useState<OuvidoriaTicket | null>(null)
  const [mensagens, setMensagens] = useState<OuvidoriaMensagem[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  const fetchTicketCompleto = useCallback(async () => {
    if (!ticketId || !profile?.tenant_id) return

    setLoading(true)
    try {
      const [ticketResp, mensagensResp] = await Promise.all([
        supabase
          .from('ouvidoria_tickets')
          .select('*')
          .eq('id', ticketId)
          .single(),
        supabase
          .from('ouvidoria_mensagens')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
      ])

      if (ticketResp.error) throw ticketResp.error
      if (mensagensResp.error) throw mensagensResp.error

      setTicket(ticketResp.data)
      setMensagens(mensagensResp.data)
    } catch (err) {
      console.error('Erro ao buscar detalhes da ouvidoria:', err)
    } finally {
      setLoading(false)
    }
  }, [ticketId, profile?.tenant_id])

  const sendMensagem = async (mensagemText: string) => {
    if (!ticket || !profile) return { error: 'Sessão inválida' }

    setLoading(true)
    try {
      const origem: 'cidadao' | 'servidor' =
        profile.role === 'cidadao' ? 'cidadao' : 'servidor'

      const { data, error } = await supabase
        .from('ouvidoria_mensagens')
        .insert({
          tenant_id: ticket.tenant_id,
          ticket_id: ticket.id,
          autor_id: profile.id,
          origem,
          mensagem: mensagemText,
        })
        .select()
        .single()

      if (error) throw error
      setMensagens((prev) => [...prev, data])
      return { data }
    } catch (err: unknown) {
      console.error('Erro ao enviar mensagem:', err)
      return { error: err instanceof Error ? err.message : String(err) }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (novoStatus: OuvidoriaTicket['status']) => {
    if (!ticket || !profile?.tenant_id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ouvidoria_tickets')
        .update({ status: novoStatus })
        .eq('id', ticket.id)

      if (error) throw error
      setTicket((prev) => prev ? { ...prev, status: novoStatus } : null)
      return { success: true }
    } catch (err: unknown) {
      console.error('Erro ao mudar status:', err)
      return { error: err instanceof Error ? err.message : String(err) }
    } finally {
      setLoading(false)
    }
  }

  return { ticket, mensagens, loading, fetchTicketCompleto, sendMensagem, updateStatus }
}
