import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type LeiRow = Database['public']['Tables']['leis']['Row']
type LeiInsert = Database['public']['Tables']['leis']['Insert']

export function useLeis() {
  const { profile } = useAuth()
  const [leis, setLeis] = useState<LeiRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeis = useCallback(async (searchQuery = '') => {
    if (!profile?.tenant_id) return
    setLoading(true)

    let query = supabase
      .from('leis')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('ano', { ascending: false })
      .order('numero', { ascending: false })
      .limit(100)

    if (searchQuery) {
      query = query.or(`numero.ilike.%${searchQuery}%,ementa.ilike.%${searchQuery}%,esfera.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      setLeis(data)
    }
    setLoading(false)
  }, [profile?.tenant_id])

  async function criarLei(payload: Omit<LeiInsert, 'tenant_id'>) {
    if (!profile?.tenant_id) return null

    const { data, error } = await supabase
      .from('leis')
      .insert({
        ...payload,
        tenant_id: profile.tenant_id
      })
      .select()
      .single()

    if (error) {
      logger.error('Erro ao criar lei:', error)
      return null
    }

    return data
  }

  async function atualizarLei(id: string, updates: Partial<LeiInsert>) {
    if (!profile?.tenant_id) return false

    const { error } = await supabase
      .from('leis')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) {
      logger.error('Erro ao atualizar lei:', error)
      return false
    }

    return true
  }

  return {
    leis,
    loading,
    fetchLeis,
    criarLei,
    atualizarLei
  }
}

export function useLeiDetalhe(leiId: string) {
  const { profile } = useAuth()
  const [lei, setLei] = useState<LeiRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!profile?.tenant_id || !leiId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('leis')
      .select('*')
      .eq('id', leiId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!error && data) {
      setLei(data)
    }
    setLoading(false)
  }, [profile?.tenant_id, leiId])

  return { lei, loading, fetch }
}
