import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import type { ProposicaoComAutor } from './useProposicoes'

interface DashboardStats {
  proposicoesEmTramitacao: number
  sessoesNoMes: number
  vereadores: number
  leisAprovadas: number
}

type ProposicoesRecentes = ProposicaoComAutor

interface ProximaSessao {
  id: string
  tipo: string
  numero: number
  ano: number
  data_inicio: string
  local: string
  status: string
}

// Executa uma query com timeout; retorna null se falhar ou exceder o prazo
async function safeRun<T>(p: PromiseLike<T>, ms = 8000): Promise<T | null> {
  try {
    return await Promise.race([
      Promise.resolve(p),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      ),
    ])
  } catch {
    return null
  }
}

export function useDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    proposicoesEmTramitacao: 0,
    sessoesNoMes: 0,
    vereadores: 0,
    leisAprovadas: 0,
  })
  const [recentes, setRecentes] = useState<ProposicoesRecentes[]>([])
  const [proximaSessao, setProximaSessao] = useState<ProximaSessao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    async function fetch() {
      setLoading(true)

      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString()

      const [
        tramitacaoResp,
        sessoesResp,
        vereRes,
        leisRes,
        recentesResp,
        proximaResp,
      ] = await Promise.all([
        safeRun(
          supabase
            .from('proposicoes')
            .select('*', { count: 'exact', head: true })
            .in('status', ['protocolado', 'em_tramitacao', 'em_comissao', 'em_votacao'])
        ),
        safeRun(
          supabase
            .from('sessoes')
            .select('*', { count: 'exact', head: true })
            .gte('data_inicio', inicioMes)
            .lte('data_inicio', fimMes)
        ),
        safeRun(
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'vereador')
            .eq('ativo', true)
        ),
        safeRun(
          supabase
            .from('proposicoes')
            .select('*', { count: 'exact', head: true })
            .in('status', ['aprovado', 'sancionado'])
            .eq('ano', agora.getFullYear())
        ),
        safeRun(
          supabase
            .from('proposicoes')
            .select('*, autor:profiles!autor_id(nome, partido)')
            .order('created_at', { ascending: false })
            .limit(5)
        ),
        safeRun(
          supabase
            .from('sessoes')
            .select('id, tipo, numero, ano, data_inicio, local, status')
            .in('status', ['agendada', 'em_andamento'])
            .order('data_inicio', { ascending: true })
            .limit(1)
            .single()
        ),
      ])

      setStats({
        proposicoesEmTramitacao: tramitacaoResp?.count ?? 0,
        sessoesNoMes: sessoesResp?.count ?? 0,
        vereadores: vereRes?.count ?? 0,
        leisAprovadas: leisRes?.count ?? 0,
      })
      setRecentes((recentesResp?.data ?? []) as unknown as ProposicoesRecentes[])
      setProximaSessao((proximaResp?.data ?? null) as ProximaSessao | null)
      setLoading(false)
    }

    fetch()
  }, [profile])

  return { stats, recentes, proximaSessao, loading }
}
