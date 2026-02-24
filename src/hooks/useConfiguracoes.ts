import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { useCallback, useEffect, useState } from 'react'

export interface TipoProposicao {
  id: string
  codigo: string
  nome: string
  sigla: string
  ativo: boolean
  ordem: number
}

export interface TipoSessao {
  id: string
  nome: string
  descricao: string | null
  quorum_percentual: number
  ativo: boolean
  ordem: number
}

export interface EtapaFluxo {
  id: string
  status_codigo: string
  label: string
  cor: string
  proximos_status: string[]
  ordem: number
  ativo: boolean
}

export function useConfiguracoes() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const tenantId = profile?.tenant_id

  const [tiposProposicao, setTiposProposicao] = useState<TipoProposicao[]>([])
  const [tiposSessao, setTiposSessao]         = useState<TipoSessao[]>([])
  const [fluxoTramitacao, setFluxoTramitacao] = useState<EtapaFluxo[]>([])
  const [loading, setLoading]                 = useState(true)

  const carregar = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    const [tpResp, tsResp, ftResp] = await Promise.all([
      supabase
        .from('tenant_tipos_proposicao')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem'),
      supabase
        .from('tenant_tipos_sessao')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem'),
      supabase
        .from('tenant_fluxo_tramitacao')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem'),
    ])

    if (tpResp.data) setTiposProposicao(tpResp.data as TipoProposicao[])
    if (tsResp.data) setTiposSessao(tsResp.data as TipoSessao[])
    if (ftResp.data) {
      setFluxoTramitacao(
        ftResp.data.map(r => ({
          ...r,
          proximos_status: (r.proximos_status as unknown as string[]) ?? [],
        })) as EtapaFluxo[]
      )
    }
    setLoading(false)
  }, [tenantId])

  useEffect(() => { carregar() }, [carregar])

  // ── Tipos de Proposição ──────────────────────────────────────

  async function salvarTipoProposicao(item: Partial<TipoProposicao> & { codigo: string; nome: string; sigla: string }) {
    if (!tenantId) return
    if (item.id) {
      const { error } = await supabase
        .from('tenant_tipos_proposicao')
        .update({ nome: item.nome, sigla: item.sigla, ativo: item.ativo, ordem: item.ordem })
        .eq('id', item.id)
        .eq('tenant_id', tenantId)
      if (error) { showToast('Erro ao salvar tipo de proposição.', 'error'); return }
    } else {
      const { error } = await supabase
        .from('tenant_tipos_proposicao')
        .insert({ tenant_id: tenantId, codigo: item.codigo, nome: item.nome, sigla: item.sigla, ordem: tiposProposicao.length })
      if (error) { showToast('Erro ao criar tipo de proposição.', 'error'); return }
    }
    showToast('Tipo de proposição salvo.', 'success')
    await carregar()
  }

  async function excluirTipoProposicao(id: string) {
    if (!tenantId) return
    const { error } = await supabase
      .from('tenant_tipos_proposicao')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) { showToast('Erro ao excluir tipo.', 'error'); return }
    showToast('Tipo excluído.', 'success')
    await carregar()
  }

  // ── Tipos de Sessão ─────────────────────────────────────────

  async function salvarTipoSessao(item: Partial<TipoSessao> & { nome: string }) {
    if (!tenantId) return
    if (item.id) {
      const { error } = await supabase
        .from('tenant_tipos_sessao')
        .update({ nome: item.nome, descricao: item.descricao, quorum_percentual: item.quorum_percentual, ativo: item.ativo, ordem: item.ordem })
        .eq('id', item.id)
        .eq('tenant_id', tenantId)
      if (error) { showToast('Erro ao salvar tipo de sessão.', 'error'); return }
    } else {
      const { error } = await supabase
        .from('tenant_tipos_sessao')
        .insert({ tenant_id: tenantId, nome: item.nome, descricao: item.descricao ?? null, quorum_percentual: item.quorum_percentual ?? 51, ordem: tiposSessao.length })
      if (error) { showToast('Erro ao criar tipo de sessão.', 'error'); return }
    }
    showToast('Tipo de sessão salvo.', 'success')
    await carregar()
  }

  async function excluirTipoSessao(id: string) {
    if (!tenantId) return
    const { error } = await supabase
      .from('tenant_tipos_sessao')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) { showToast('Erro ao excluir tipo.', 'error'); return }
    showToast('Tipo excluído.', 'success')
    await carregar()
  }

  // ── Fluxo de Tramitação ──────────────────────────────────────

  async function salvarEtapaFluxo(item: Partial<EtapaFluxo> & { status_codigo: string; label: string }) {
    if (!tenantId) return
    const payload = {
      label: item.label,
      cor: item.cor ?? '#6b7280',
      proximos_status: item.proximos_status ?? [],
      ativo: item.ativo ?? true,
      ordem: item.ordem ?? fluxoTramitacao.length,
    }
    if (item.id) {
      const { error } = await supabase
        .from('tenant_fluxo_tramitacao')
        .update(payload)
        .eq('id', item.id)
        .eq('tenant_id', tenantId)
      if (error) { showToast('Erro ao salvar etapa.', 'error'); return }
    } else {
      const { error } = await supabase
        .from('tenant_fluxo_tramitacao')
        .insert({ tenant_id: tenantId, status_codigo: item.status_codigo, ...payload })
      if (error) { showToast('Erro ao criar etapa.', 'error'); return }
    }
    showToast('Etapa do fluxo salva.', 'success')
    await carregar()
  }

  async function excluirEtapaFluxo(id: string) {
    if (!tenantId) return
    const { error } = await supabase
      .from('tenant_fluxo_tramitacao')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) { showToast('Erro ao excluir etapa.', 'error'); return }
    showToast('Etapa excluída.', 'success')
    await carregar()
  }

  // ── Upload de Logo ───────────────────────────────────────────

  async function uploadLogo(file: File): Promise<string | null> {
    if (!tenantId) return null
    const ext = file.name.split('.').pop()
    const path = `logos/${tenantId}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      showToast('Erro ao enviar logo.', 'error')
      return null
    }

    const { data } = supabase.storage.from('documentos').getPublicUrl(path)
    return data.publicUrl
  }

  return {
    loading,
    tiposProposicao,
    tiposSessao,
    fluxoTramitacao,
    salvarTipoProposicao,
    excluirTipoProposicao,
    salvarTipoSessao,
    excluirTipoSessao,
    salvarEtapaFluxo,
    excluirEtapaFluxo,
    uploadLogo,
    recarregar: carregar,
  }
}
