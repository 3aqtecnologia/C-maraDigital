import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { useCallback, useEffect, useState } from 'react'

type Proposicao = Database['public']['Tables']['proposicoes']['Row']
type Lei = Database['public']['Tables']['leis']['Row']
type Sessao = Database['public']['Tables']['sessoes']['Row']
type Tramitacao = Database['public']['Tables']['tramitacoes']['Row']

export interface ProposicaoPublica extends Proposicao {
  autor: { nome: string; partido: string | null } | null
}

export interface TramitacaoPublica extends Tramitacao {
  responsavel: { nome: string } | null
}

export function useTransparencia(tenantId?: string) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    proposicoes: 0,
    leis: 0,
    sessoes: 0
  })

  // Busca estatísticas gerais (públicas)
  const fetchStats = useCallback(async () => {
    if (!tenantId) return

    const [propCount, leiCount, sessaoCount] = await Promise.all([
      supabase.from('proposicoes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).not('status', 'eq', 'rascunho'),
      supabase.from('leis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabase.from('sessoes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    ])

    setStats({
      proposicoes: propCount.count || 0,
      leis: leiCount.count || 0,
      sessoes: sessaoCount.count || 0
    })
  }, [tenantId])

  // Busca proposições públicas
  const fetchProposicoes = useCallback(async (search = '') => {
    if (!tenantId) return []

    let query = supabase
      .from('proposicoes')
      .select('*, autor:profiles!autor_id(nome, partido)')
      .eq('tenant_id', tenantId)
      .not('status', 'eq', 'rascunho')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`numero.ilike.%${search}%,ementa.ilike.%${search}%`)
    }

    const { data } = await query.limit(50)
    return (data || []) as unknown as ProposicaoPublica[]
  }, [tenantId])

  // Busca leis públicas
  const fetchLeis = useCallback(async (search = '') => {
    if (!tenantId) return []

    let query = supabase
      .from('leis')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_publicacao', { ascending: false })

    if (search) {
      query = query.or(`numero.ilike.%${search}%,ementa.ilike.%${search}%,esfera.ilike.%${search}%`)
    }

    const { data } = await query.limit(50)
    return (data || []) as Lei[]
  }, [tenantId])

  // Busca sessões públicas
  const fetchSessoes = useCallback(async () => {
    if (!tenantId) return []

    const { data } = await supabase
      .from('sessoes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_inicio', { ascending: false })
      .limit(20)

    return (data || []) as Sessao[]
  }, [tenantId])

  useEffect(() => {
    if (tenantId) {
      fetchStats().finally(() => setLoading(false))
    }
  }, [tenantId, fetchStats])

  return {
    loading,
    stats,
    fetchProposicoes,
    fetchLeis,
    fetchSessoes,
    fetchStats
  }
}

// Hook para detalhe público de proposição
export function useProposicaoPublica(id: string) {
  const [proposicao, setProposicao] = useState<ProposicaoPublica | null>(null)
  const [tramitacoes, setTramitacoes] = useState<TramitacaoPublica[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)

    const [propResp, tramResp] = await Promise.all([
      supabase
        .from('proposicoes')
        .select('*, autor:profiles!autor_id(nome, partido)')
        .eq('id', id)
        .not('status', 'eq', 'rascunho')
        .single(),
      supabase
        .from('tramitacoes')
        .select('*, responsavel:profiles!responsavel_id(nome)')
        .eq('proposicao_id', id)
        .order('created_at', { ascending: true }),
    ])

    setProposicao(propResp.data as unknown as ProposicaoPublica)
    setTramitacoes((tramResp.data || []) as unknown as TramitacaoPublica[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { proposicao, tramitacoes, loading }
}

// Hook para detalhe público de lei
export function useLeiPublica(id: string) {
  const [lei, setLei] = useState<Lei | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)

    const { data } = await supabase
      .from('leis')
      .select('*')
      .eq('id', id)
      .single()

    setLei(data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  return { lei, loading }
}

const TENANT_PUBLIC_FIELDS = 'id, nome, municipio, uf, logo_url, cor_primaria, cor_secundaria, endereco, telefone, whatsapp, email_geral, site_url, horario_atendimento'

// Hook para buscar dados básicos do tenant via slug
export function useTenantBySlug(slug: string | null) {
  const [tenant, setTenant] = useState<Partial<Database['public']['Tables']['tenants']['Row']> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('tenants')
          .select(TENANT_PUBLIC_FIELDS)
          .eq('slug', slug)
          .eq('ativo', true)
          .single()
        setTenant(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  return { tenant, loading }
}

// Hook para buscar dados básicos do tenant via id (usado em dev quando não há subdomínio)
export function useTenantById(id: string | null) {
  const [tenant, setTenant] = useState<Partial<Database['public']['Tables']['tenants']['Row']> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('tenants')
          .select(TENANT_PUBLIC_FIELDS)
          .eq('id', id)
          .eq('ativo', true)
          .single()
        setTenant(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return { tenant, loading }
}

// Hook para pegar o primeiro tenant ativo (fallback para dev)
export function useFirstActiveTenant(enabled: boolean) {
  const [tenant, setTenant] = useState<Partial<Database['public']['Tables']['tenants']['Row']> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('tenants')
          .select(TENANT_PUBLIC_FIELDS)
          .eq('ativo', true)
          .limit(1)
          .single()
        setTenant(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [enabled])

  return { tenant, loading }
}
