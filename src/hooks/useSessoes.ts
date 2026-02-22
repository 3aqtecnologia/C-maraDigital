import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database, SessaoTipo } from '@/types/database'
import { useAuth } from './useAuth'

type Sessao = Database['public']['Tables']['sessoes']['Row']
type SessaoInsert = Database['public']['Tables']['sessoes']['Insert']

export type SessaoComPauta = Sessao & {
  pauta_itens: Array<{
    id: string
    ordem: number
    em_votacao: boolean
    proposicao: {
      id: string
      numero: string
      tipo: string
      ementa: string
      status: string
    } | null
  }>
}

export function useSessoes() {
  const { profile } = useAuth()
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data, error: err } = await supabase
      .from('sessoes')
      .select('*')
      .order('data_inicio', { ascending: false })

    if (err) setError(err.message)
    else setSessoes(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetch() }, [fetch])

  async function criar(dados: {
    tipo: SessaoTipo
    data_inicio: string
    local: string
    quorum_minimo: number
  }): Promise<{ id: string } | null> {
    if (!profile) return null

    // Próximo número da sessão no ano
    const ano = new Date().getFullYear()
    const { count } = await supabase
      .from('sessoes')
      .select('*', { count: 'exact', head: true })
      .eq('ano', ano)

    const insert: SessaoInsert = {
      tenant_id:     profile.tenant_id,
      numero:        (count ?? 0) + 1,
      ano,
      tipo:          dados.tipo,
      status:        'agendada',
      data_inicio:   dados.data_inicio,
      local:         dados.local,
      quorum_minimo: dados.quorum_minimo,
      presentes:     [],
    }

    const { data, error: err } = await supabase
      .from('sessoes')
      .insert(insert)
      .select('id')
      .single()

    if (err) { setError(err.message); return null }
    await fetch()
    return data
  }

  async function iniciar(id: string): Promise<boolean> {
    const { error: err } = await supabase
      .from('sessoes')
      .update({ status: 'em_andamento', data_inicio: new Date().toISOString() })
      .eq('id', id)
    if (err) { setError(err.message); return false }
    await fetch()
    return true
  }

  async function encerrar(id: string): Promise<boolean> {
    const { error: err } = await supabase
      .from('sessoes')
      .update({ status: 'encerrada', data_fim: new Date().toISOString() })
      .eq('id', id)
    if (err) { setError(err.message); return false }
    await fetch()
    return true
  }

  return { sessoes, loading, error, fetch, criar, iniciar, encerrar }
}

// Hook detalhe de uma sessão com pauta e votos em tempo real
export function useSessaoAtiva(id: string) {
  const { profile } = useAuth()
  const [sessao, setSessao] = useState<SessaoComPauta | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSessao = useCallback(async () => {
    const { data } = await supabase
      .from('sessoes')
      .select(`
        *,
        pauta_itens (
          id, ordem, em_votacao,
          proposicao:proposicoes!proposicao_id(id, numero, tipo, ementa, status)
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      const raw = data as unknown as SessaoComPauta
      const sorted: SessaoComPauta = {
        ...raw,
        pauta_itens: [...(raw.pauta_itens ?? [])].sort((a, b) => a.ordem - b.ordem),
      }
      setSessao(sorted)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchSessao()

    // Realtime subscription
    const channel = supabase
      .channel(`sessao-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sessoes',
        filter: `id=eq.${id}`,
      }, () => fetchSessao())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'votos',
        filter: `sessao_id=eq.${id}`,
      }, () => fetchSessao())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pauta_itens',
        filter: `sessao_id=eq.${id}`,
      }, () => fetchSessao())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchSessao])

  async function votar(proposicao_id: string, opcao: 'sim' | 'nao' | 'abstencao'): Promise<boolean> {
    if (!profile) return false
    const { error } = await supabase.from('votos').insert({
      tenant_id:     profile.tenant_id,
      sessao_id:     id,
      proposicao_id,
      vereador_id:   profile.id,
      opcao,
    })
    return !error
  }

  async function iniciarVotacao(pauta_item_id: string): Promise<void> {
    // Desativa todos, ativa o selecionado
    if (!sessao) return
    await supabase
      .from('pauta_itens')
      .update({ em_votacao: false })
      .eq('sessao_id', id)

    await supabase
      .from('pauta_itens')
      .update({ em_votacao: true })
      .eq('id', pauta_item_id)
  }

  async function encerrarVotacao(pauta_item_id: string): Promise<void> {
    await supabase
      .from('pauta_itens')
      .update({ em_votacao: false })
      .eq('id', pauta_item_id)
  }

  return { sessao, loading, votar, iniciarVotacao, encerrarVotacao, fetchSessao }
}
