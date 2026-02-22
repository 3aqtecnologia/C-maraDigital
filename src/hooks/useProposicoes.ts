import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database, ProposicaoStatus, ProposicaoTipo } from '@/types/database'
import { useAuth } from './useAuth'

type Proposicao = Database['public']['Tables']['proposicoes']['Row']
type ProposicaoInsert = Database['public']['Tables']['proposicoes']['Insert']

export interface ProposicaoComAutor extends Proposicao {
  autor: { nome: string; partido: string | null } | null
}

export function useProposicoes(filtroStatus?: ProposicaoStatus | 'todos') {
  const { profile } = useAuth()
  const [proposicoes, setProposicoes] = useState<ProposicaoComAutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)

    let query = supabase
      .from('proposicoes')
      .select('*, autor:profiles!autor_id(nome, partido)')
      .order('created_at', { ascending: false })

    if (filtroStatus && filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error: err } = await query

    if (err) {
      setError(err.message)
    } else {
      setProposicoes((data ?? []) as unknown as ProposicaoComAutor[])
    }
    setLoading(false)
  }, [profile, filtroStatus])

  useEffect(() => { fetch() }, [fetch])

  async function criar(dados: {
    tipo: ProposicaoTipo
    ementa: string
    texto_integral?: string
  }): Promise<{ id: string } | null> {
    if (!profile) return null

    // Gera número automático via função do banco
    const { data: numData } = await supabase
      .rpc('next_proposicao_numero', {
        p_tenant_id: profile.tenant_id,
        p_tipo: dados.tipo,
        p_ano: new Date().getFullYear(),
      })

    const numero = (numData as string | null) ?? '001'

    const insert: ProposicaoInsert = {
      tenant_id:      profile.tenant_id,
      numero,
      ano:            new Date().getFullYear(),
      tipo:           dados.tipo,
      ementa:         dados.ementa,
      texto_integral: dados.texto_integral ?? null,
      autor_id:       profile.id,
      status:         'rascunho',
      data_protocolo: new Date().toISOString().split('T')[0],
    }

    const { data, error: err } = await supabase
      .from('proposicoes')
      .insert(insert)
      .select('id')
      .single()

    if (err) { setError(err.message); return null }

    await fetch()
    return data
  }

  async function protocolar(id: string): Promise<boolean> {
    const { error: err } = await supabase
      .from('proposicoes')
      .update({ status: 'protocolado', data_protocolo: new Date().toISOString().split('T')[0] })
      .eq('id', id)

    if (err) { setError(err.message); return false }

    // Registra tramitação
    const proposicao = proposicoes.find(p => p.id === id)
    if (proposicao && profile) {
      await supabase.from('tramitacoes').insert({
        tenant_id:      profile.tenant_id,
        proposicao_id:  id,
        status_anterior: proposicao.status,
        status_novo:    'protocolado',
        descricao:      'Proposição protocolada e registrada oficialmente.',
        responsavel_id: profile.id,
      })
    }

    await fetch()
    return true
  }

  async function atualizarStatus(
    id: string,
    novoStatus: ProposicaoStatus,
    descricao?: string
  ): Promise<boolean> {
    const proposicao = proposicoes.find(p => p.id === id)
    if (!proposicao || !profile) return false

    const { error: err } = await supabase
      .from('proposicoes')
      .update({ status: novoStatus })
      .eq('id', id)

    if (err) { setError(err.message); return false }

    await supabase.from('tramitacoes').insert({
      tenant_id:      profile.tenant_id,
      proposicao_id:  id,
      status_anterior: proposicao.status,
      status_novo:    novoStatus,
      descricao:      descricao ?? null,
      responsavel_id: profile.id,
    })

    await fetch()
    return true
  }

  return { proposicoes, loading, error, fetch, criar, protocolar, atualizarStatus }
}

// Hook para um único detalhe com tramitações
export function useProposicaoDetalhe(id: string) {
  const [proposicao, setProposicao] = useState<ProposicaoComAutor | null>(null)
  const [tramitacoes, setTramitacoes] = useState<
    Array<Database['public']['Tables']['tramitacoes']['Row'] & {
      responsavel: { nome: string } | null
    }>
  >([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const [propResp, tramResp] = await Promise.all([
      supabase
        .from('proposicoes')
        .select('*, autor:profiles!autor_id(nome, partido)')
        .eq('id', id)
        .single(),
      supabase
        .from('tramitacoes')
        .select('*, responsavel:profiles!responsavel_id(nome)')
        .eq('proposicao_id', id)
        .order('created_at', { ascending: true }),
    ])
    setProposicao(propResp.data ? (propResp.data as unknown as ProposicaoComAutor) : null)
    setTramitacoes((tramResp.data ?? []) as unknown as typeof tramitacoes)
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { proposicao, tramitacoes, loading, fetch }
}
