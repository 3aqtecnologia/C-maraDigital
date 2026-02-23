import { supabase } from '@/lib/supabase'
import type { Database, TeletrabalhoStatus } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type TeletrabalhoRow = Database['public']['Tables']['teletrabalho_registros']['Row']

export interface TeletrabalhoComNome extends TeletrabalhoRow {
  profiles?: { nome: string; role: string } | null
}

export function useTeletrabalho() {
  const { profile } = useAuth()
  const [registros, setRegistros] = useState<TeletrabalhoComNome[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin'

  const fetchRegistros = useCallback(async (filtroStatus = '') => {
    if (!profile?.tenant_id) return
    setLoading(true)

    let query = supabase
      .from('teletrabalho_registros')
      .select('*, profiles(nome, role)')
      .eq('tenant_id', profile.tenant_id)
      .order('data', { ascending: false })

    // Servidor comum vê apenas os próprios registros
    if (!isAdmin) {
      query = query.eq('profile_id', profile.id)
    }

    if (filtroStatus) {
      query = query.eq('status', filtroStatus as TeletrabalhoStatus)
    }

    const { data, error } = await query
    if (!error && data) setRegistros((data as unknown) as TeletrabalhoComNome[])
    setLoading(false)
  }, [profile?.tenant_id, profile?.id, isAdmin])

  async function registrarTeletrabalho(payload: {
    data: string
    hora_inicio?: string
    hora_fim?: string
    atividades: string
  }): Promise<{ error: string | null }> {
    if (!profile?.tenant_id) return { error: 'Sem permissão' }

    const { error } = await supabase.from('teletrabalho_registros').insert({
      tenant_id: profile.tenant_id,
      profile_id: profile.id,
      data: payload.data,
      hora_inicio: payload.hora_inicio || null,
      hora_fim: payload.hora_fim || null,
      atividades: payload.atividades,
    })

    if (error) return { error: error.message }
    return { error: null }
  }

  async function atualizarStatus(
    id: string,
    status: TeletrabalhoStatus,
    obs_gestor?: string
  ): Promise<{ error: string | null }> {
    if (!profile?.id) return { error: 'Sem permissão' }

    const { error } = await supabase
      .from('teletrabalho_registros')
      .update({
        status,
        obs_gestor: obs_gestor ?? null,
        aprovado_por: profile.id,
      })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    return { error: null }
  }

  async function deletarRegistro(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teletrabalho_registros')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile?.tenant_id ?? '')

    return !error
  }

  return { registros, loading, isAdmin, fetchRegistros, registrarTeletrabalho, atualizarStatus, deletarRegistro }
}
