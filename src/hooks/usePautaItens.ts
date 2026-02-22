import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PautaItem = Database['public']['Tables']['pauta_itens']['Row'] & {
  proposicao: {
    id: string
    numero: string
    tipo: string
    ementa: string
    status: string
  } | null
}

export function usePautaItens(sessaoId: string) {
  const [itens, setItens] = useState<PautaItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pauta_itens')
      .select('*, proposicao:proposicoes!proposicao_id(id, numero, tipo, ementa, status)')
      .eq('sessao_id', sessaoId)
      .order('ordem', { ascending: true })

    setItens((data ?? []) as unknown as PautaItem[])
    setLoading(false)
  }, [sessaoId])

  useEffect(() => { fetch() }, [fetch])

  async function adicionarItem(proposicaoId: string): Promise<boolean> {
    const proxOrdem = itens.length > 0
      ? Math.max(...itens.map(i => i.ordem)) + 1
      : 1

    const { error } = await supabase
      .from('pauta_itens')
      .insert({
        sessao_id: sessaoId,
        proposicao_id: proposicaoId,
        ordem: proxOrdem,
      })

    if (error) return false
    await fetch()
    return true
  }

  async function removerItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pauta_itens')
      .delete()
      .eq('id', itemId)

    if (error) return false
    await fetch()
    return true
  }

  async function reordenar(itemId: string, novaOrdem: number): Promise<void> {
    await supabase
      .from('pauta_itens')
      .update({ ordem: novaOrdem })
      .eq('id', itemId)
    await fetch()
  }

  return { itens, loading, fetch, adicionarItem, removerItem, reordenar }
}
