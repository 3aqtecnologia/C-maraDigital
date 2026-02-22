import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle,
  ChevronRight, Send, AlertCircle, Edit3, Download
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProposicaoDetalhe, useProposicoes } from '@/hooks/useProposicoes'
import { useAuth } from '@/hooks/useAuth'
import type { ProposicaoStatus } from '@/types/database'

const STATUS_CONFIG: Record<ProposicaoStatus, { label: string; color: string; bg: string }> = {
  rascunho:      { label: 'Rascunho',       color: 'text-gray-600',   bg: 'bg-gray-100' },
  protocolado:   { label: 'Protocolado',    color: 'text-blue-700',   bg: 'bg-blue-100' },
  em_tramitacao: { label: 'Em Tramitação',  color: 'text-yellow-700', bg: 'bg-yellow-100' },
  em_comissao:   { label: 'Em Comissão',    color: 'text-orange-700', bg: 'bg-orange-100' },
  em_votacao:    { label: 'Em Votação',     color: 'text-purple-700', bg: 'bg-purple-100' },
  aprovado:      { label: 'Aprovado',       color: 'text-green-700',  bg: 'bg-green-100' },
  rejeitado:     { label: 'Rejeitado',      color: 'text-red-700',    bg: 'bg-red-100' },
  arquivado:     { label: 'Arquivado',      color: 'text-gray-500',   bg: 'bg-gray-100' },
  sancionado:    { label: 'Sancionado',     color: 'text-emerald-700',bg: 'bg-emerald-100' },
  vetado:        { label: 'Vetado',         color: 'text-red-600',    bg: 'bg-red-100' },
}

const TIPO_SIGLAS: Record<string, string> = {
  projeto_lei: 'PL', projeto_lei_complementar: 'PLC', projeto_resolucao: 'PR',
  requerimento: 'REQ', indicacao: 'IND', moca_aplausos: 'MOC', voto_pesar: 'VP',
}

const TRANSICOES: Partial<Record<ProposicaoStatus, { status: ProposicaoStatus; label: string; color: string }[]>> = {
  rascunho:      [{ status: 'protocolado',   label: 'Protocolar',        color: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  protocolado:   [{ status: 'em_tramitacao', label: 'Iniciar Tramitação', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' }],
  em_tramitacao: [
    { status: 'em_comissao',  label: 'Enviar à Comissão',  color: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { status: 'em_votacao',   label: 'Colocar em Votação', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { status: 'arquivado',    label: 'Arquivar',            color: 'bg-gray-500 hover:bg-gray-600 text-white' },
  ],
  em_comissao:   [
    { status: 'em_votacao',   label: 'Colocar em Votação', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { status: 'arquivado',    label: 'Arquivar',            color: 'bg-gray-500 hover:bg-gray-600 text-white' },
  ],
  em_votacao:    [
    { status: 'aprovado',     label: 'Aprovar',             color: 'bg-green-600 hover:bg-green-700 text-white' },
    { status: 'rejeitado',    label: 'Rejeitar',            color: 'bg-red-600 hover:bg-red-700 text-white' },
  ],
  aprovado:      [{ status: 'sancionado', label: 'Sancionar', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  { status: 'vetado',     label: 'Vetar',     color: 'bg-red-500 hover:bg-red-600 text-white' }],
}

export function ProposicaoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { proposicao, tramitacoes, loading, fetch } = useProposicaoDetalhe(id!)
  const { protocolar, atualizarStatus } = useProposicoes()

  const [descricao, setDescricao] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'
  const proximas = proposicao ? (TRANSICOES[proposicao.status] ?? []) : []

  async function transicionar(novoStatus: ProposicaoStatus) {
    if (!proposicao) return
    setTransitioning(true)
    setErro(null)

    let ok: boolean
    if (novoStatus === 'protocolado') {
      ok = await protocolar(proposicao.id)
    } else {
      ok = await atualizarStatus(proposicao.id, novoStatus, descricao || undefined)
    }

    if (!ok) setErro('Erro ao atualizar status. Tente novamente.')
    else { setDescricao(''); fetch() }
    setTransitioning(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400">Carregando proposição...</p>
        </div>
      </div>
    )
  }

  if (!proposicao) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>Proposição não encontrada</p>
          <button onClick={() => navigate('/backoffice/legislativo')} className="btn-primary mt-4 text-sm">
            Voltar à lista
          </button>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[proposicao.status]
  const numero = `${TIPO_SIGLAS[proposicao.tipo] ?? proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={numero}
        description={proposicao.ementa}
        actions={
          <button
            onClick={() => navigate('/backoffice/legislativo')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Metadados */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`badge text-sm px-3 py-1 ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs flex items-center gap-1.5">
                    <Download size={13} />
                    PDF
                  </button>
                  {isAdmin && proposicao.status === 'rascunho' && (
                    <button className="btn-secondary text-xs flex items-center gap-1.5">
                      <Edit3 size={13} />
                      Editar
                    </button>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-medium">Autor</dt>
                  <dd className="text-gray-900 font-medium mt-0.5">
                    {proposicao.autor?.nome ?? '—'}
                    {proposicao.autor?.partido && (
                      <span className="text-gray-400 font-normal"> ({proposicao.autor.partido})</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-medium">Data de Protocolo</dt>
                  <dd className="text-gray-900 mt-0.5">
                    {new Date(proposicao.data_protocolo).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs uppercase font-medium">Tipo</dt>
                  <dd className="text-gray-900 capitalize mt-0.5">
                    {proposicao.tipo.replace(/_/g, ' ')}
                  </dd>
                </div>
                {proposicao.data_publicacao && (
                  <div>
                    <dt className="text-gray-400 text-xs uppercase font-medium">Data de Publicação</dt>
                    <dd className="text-gray-900 mt-0.5">
                      {new Date(proposicao.data_publicacao).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Texto integral */}
            {proposicao.texto_integral && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Texto Integral</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 rounded-lg p-4 max-h-80 overflow-auto">
                  {proposicao.texto_integral}
                </pre>
              </div>
            )}

            {/* Linha do tempo de tramitação */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Clock size={16} className="text-primary-600" />
                Histórico de Tramitação
              </h2>

              {tramitacoes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Nenhuma movimentação registrada</p>
              ) : (
                <ol className="relative border-l-2 border-gray-200 ml-2 space-y-0">
                  {tramitacoes.map((t, i) => {
                    const isLast = i === tramitacoes.length - 1
                    const novoCfg = STATUS_CONFIG[t.status_novo]
                    return (
                      <li key={t.id} className="ml-6 pb-6">
                        <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full border-2 border-white ${isLast ? 'bg-primary-600' : 'bg-gray-300'}`} />
                        <div className="flex items-center gap-2 mb-1">
                          {t.status_anterior && (
                            <>
                              <span className={`badge text-xs ${STATUS_CONFIG[t.status_anterior]?.bg} ${STATUS_CONFIG[t.status_anterior]?.color}`}>
                                {STATUS_CONFIG[t.status_anterior]?.label}
                              </span>
                              <ChevronRight size={12} className="text-gray-400" />
                            </>
                          )}
                          <span className={`badge text-xs ${novoCfg.bg} ${novoCfg.color}`}>
                            {novoCfg.label}
                          </span>
                        </div>
                        {t.descricao && (
                          <p className="text-sm text-gray-600 mt-1">{t.descricao}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {t.responsavel?.nome && <span>{t.responsavel.nome} · </span>}
                          {new Date(t.created_at).toLocaleString('pt-BR')}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>

          {/* Coluna lateral — Ações */}
          <div className="space-y-4">
            {/* Próximas ações */}
            {isAdmin && proximas.length > 0 && (
              <div className="card space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Send size={15} className="text-primary-600" />
                  Movimentar
                </h2>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Observação (opcional)
                  </label>
                  <textarea
                    rows={2}
                    className="input resize-none text-sm"
                    placeholder="Descreva a movimentação..."
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>

                {erro && (
                  <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    {erro}
                  </div>
                )}

                <div className="space-y-2">
                  {proximas.map(acao => (
                    <button
                      key={acao.status}
                      disabled={transitioning}
                      onClick={() => transicionar(acao.status)}
                      className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${acao.color}`}
                    >
                      {transitioning ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : acao.status === 'aprovado' ? <CheckCircle2 size={14} />
                        : acao.status === 'rejeitado' ? <XCircle size={14} />
                        : <ChevronRight size={14} />}
                      {acao.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status final */}
            {['aprovado','rejeitado','arquivado','sancionado','vetado'].includes(proposicao.status) && (
              <div className={`card text-center py-6 ${cfg.bg}`}>
                <div className={`text-4xl mb-2 ${cfg.color}`}>
                  {['aprovado','sancionado'].includes(proposicao.status) ? '✓'
                    : ['rejeitado','vetado'].includes(proposicao.status) ? '✗' : '○'}
                </div>
                <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
                <p className="text-xs text-gray-500 mt-1">Processo encerrado</p>
              </div>
            )}

            {/* Info */}
            <div className="card text-xs text-gray-400 space-y-1">
              <p><span className="font-medium text-gray-600">ID:</span> {proposicao.id}</p>
              <p><span className="font-medium text-gray-600">Criado:</span> {new Date(proposicao.created_at).toLocaleString('pt-BR')}</p>
              <p><span className="font-medium text-gray-600">Atualizado:</span> {new Date(proposicao.updated_at).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
