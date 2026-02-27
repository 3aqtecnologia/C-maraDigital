import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import {
  useOuvidoria,
  useOuvidoriaDetalhe,
  type OuvidoriaTicket,
} from '@/hooks/useOuvidoria'
import type { OuvidoriaTipo } from '@/types/database'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Lock,
  MessageSquarePlus,
  Search,
  Send,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ── Constantes ──────────────────────────────────────────────────

const TIPO_LABELS: Record<OuvidoriaTipo, string> = {
  denuncia:          'Denúncia',
  reclamacao:        'Reclamação',
  solicitacao:       'Solicitação',
  sugestao:          'Sugestão',
  elogio:            'Elogio',
  pedido_informacao: 'Pedido de Informação (LAI)',
}

const STATUS_COLOR: Record<string, string> = {
  novo:        'bg-blue-100 text-blue-800',
  em_analise:  'bg-yellow-100 text-yellow-800',
  respondido:  'bg-purple-100 text-purple-800',
  concluido:   'bg-green-100 text-green-800',
  arquivado:   'bg-gray-100 text-gray-800',
}

const STATUS_LABEL: Record<string, string> = {
  novo:       'Novo',
  em_analise: 'Em Análise',
  respondido: 'Respondido',
  concluido:  'Concluído',
  arquivado:  'Arquivado',
}

// ── Modal Nova Manifestação ──────────────────────────────────────

interface NovaManifestacaoModalProps {
  onClose: () => void
  onSuccess: () => void
}

function NovaManifestacaoModal({ onClose, onSuccess }: NovaManifestacaoModalProps) {
  const { addTicket } = useOuvidoria()
  const [tipo, setTipo] = useState<OuvidoriaTipo>('solicitacao')
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [sigiloso, setSigiloso] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const firstRef = useRef<HTMLSelectElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!assunto.trim() || !descricao.trim()) return
    setSaving(true)
    setError(null)
    const result = await addTicket({ assunto: assunto.trim(), descricao: descricao.trim(), tipo, sigiloso })
    setSaving(false)
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : 'Erro ao registrar manifestação.')
    } else if (result?.data) {
      setProtocolo(result.data.protocolo)
    }
  }

  if (protocolo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sucesso"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" aria-hidden="true" />
          </div>
          <h2 id="modal-sucesso" className="text-xl font-bold text-gray-900 mb-2">Manifestação registrada!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Guarde o número do protocolo para acompanhar sua solicitação.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 mb-6 font-mono text-lg font-bold text-gray-900">
            {protocolo}
          </div>
          <button
            onClick={() => { onSuccess(); onClose() }}
            className="btn-primary w-full justify-center"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-nova"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="modal-nova" className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-primary-600" aria-hidden="true" />
            Nova Manifestação / e-SIC
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="tipo-manifestacao" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="tipo-manifestacao"
              ref={firstRef}
              className="input"
              value={tipo}
              onChange={e => setTipo(e.target.value as OuvidoriaTipo)}
            >
              {(Object.entries(TIPO_LABELS) as [OuvidoriaTipo, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assunto-manifestacao" className="block text-sm font-medium text-gray-700 mb-1.5">
              Assunto <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="assunto-manifestacao"
              type="text"
              className="input"
              placeholder="Resumo breve da solicitação"
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="descricao-manifestacao" className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="descricao-manifestacao"
              className="input resize-none"
              rows={4}
              placeholder="Descreva detalhadamente a solicitação..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={sigiloso}
              onChange={e => setSigiloso(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              <span className="font-medium flex items-center gap-1.5">
                <Lock size={13} aria-hidden="true" /> Manter em sigilo
              </span>
              <span className="text-gray-500 text-xs block mt-0.5">
                Sua identidade não será divulgada publicamente.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm" role="alert">
              <AlertCircle size={15} aria-hidden="true" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !assunto.trim() || !descricao.trim()}
              className="btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" /> Registrando...</>
                : <><Send size={15} aria-hidden="true" /> Registrar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Drawer Detalhe do Ticket ─────────────────────────────────────

const PROXIMAS_ACOES: Partial<Record<string, { status: OuvidoriaTicket['status']; label: string; color: string }[]>> = {
  novo:       [{ status: 'em_analise', label: 'Iniciar Análise',    color: 'bg-yellow-500 hover:bg-yellow-600 text-white' }],
  em_analise: [
    { status: 'respondido', label: 'Marcar Respondido', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { status: 'concluido',  label: 'Concluir',           color: 'bg-green-600 hover:bg-green-700 text-white'  },
    { status: 'arquivado',  label: 'Arquivar',            color: 'bg-gray-500 hover:bg-gray-600 text-white'   },
  ],
  respondido: [
    { status: 'concluido', label: 'Concluir', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { status: 'arquivado', label: 'Arquivar', color: 'bg-gray-500 hover:bg-gray-600 text-white'   },
  ],
}

interface TicketDetalheDrawerProps {
  ticketId: string
  isServidor: boolean
  onClose: () => void
  onStatusChange: () => void
}

function TicketDetalheDrawer({ ticketId, isServidor, onClose, onStatusChange }: TicketDetalheDrawerProps) {
  const { ticket, mensagens, loading, fetchTicketCompleto, sendMensagem, updateStatus } = useOuvidoriaDetalhe(ticketId)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchTicketCompleto() }, [fetchTicketCompleto])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  async function doSend() {
    if (!novaMensagem.trim()) return
    setSending(true)
    await sendMensagem(novaMensagem.trim())
    setNovaMensagem('')
    setSending(false)
  }

  function handleSend(e: { preventDefault(): void }) {
    e.preventDefault()
    doSend()
  }

  async function handleStatus(novoStatus: OuvidoriaTicket['status']) {
    setUpdatingStatus(true)
    await updateStatus(novoStatus)
    setUpdatingStatus(false)
    onStatusChange()
  }

  const proximas = ticket ? (PROXIMAS_ACOES[ticket.status] ?? []) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white w-full sm:w-[520px] flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-titulo"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            {loading || !ticket ? (
              <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" aria-hidden="true" />
            ) : (
              <>
                <h2 id="detalhe-titulo" className="font-bold text-gray-900 text-sm font-mono">
                  {ticket.protocolo}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TIPO_LABELS[ticket.tipo as OuvidoriaTipo] ?? ticket.tipo}
                  {' · '}
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          </div>
        ) : !ticket ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Manifestação não encontrada.
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[ticket.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
                {ticket.sigiloso && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Lock size={11} aria-hidden="true" /> Sigiloso
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">{ticket.assunto}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{ticket.descricao}</p>
            </div>

            {/* Mensagens */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              aria-label="Thread de mensagens"
            >
              {mensagens.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Nenhuma resposta ainda.</p>
              ) : (
                mensagens.map(msg => {
                  const isServs = msg.origem === 'servidor'
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isServs ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider px-1">
                        {isServs ? 'Equipe' : 'Cidadão'} · {new Date(msg.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isServs ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                        {msg.mensagem}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Ações de status (servidor) */}
            {isServidor && proximas.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {proximas.map(acao => (
                    <button
                      key={acao.status}
                      onClick={() => handleStatus(acao.status)}
                      disabled={updatingStatus}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${acao.color}`}
                    >
                      {acao.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resposta */}
            <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  className="input resize-none flex-1 text-sm"
                  rows={2}
                  placeholder="Escreva uma mensagem..."
                  value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                  aria-label="Campo de mensagem"
                />
                <button
                  type="submit"
                  disabled={sending || !novaMensagem.trim()}
                  className="btn-primary p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-40"
                  aria-label="Enviar mensagem"
                >
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    : <Send size={16} aria-hidden="true" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Enter envia · Shift+Enter nova linha</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Página Principal ─────────────────────────────────────────────

export function Ouvidoria() {
  const { profile } = useAuth()
  const { tickets, loading, fetchTickets } = useOuvidoria()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNovaModal, setShowNovaModal] = useState(false)
  const [ticketDetalheId, setTicketDetalheId] = useState<string | null>(null)

  const isServidor = profile?.role === 'admin' || profile?.role === 'servidor'

  const fetch = useCallback(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => { fetch() }, [fetch])

  const filteredTickets = tickets.filter(ticket =>
    ticket.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ouvidoria & e-SIC"
        description={
          isServidor
            ? 'Gestão de manifestações e pedidos de informação (LAI 12.527/2011).'
            : 'Acompanhe suas solicitações e pedidos de informação.'
        }
      />

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por protocolo ou assunto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            aria-label="Buscar manifestações"
          />
        </div>

        <button
          onClick={() => setShowNovaModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <MessageSquarePlus size={18} aria-hidden="true" />
          Nova Manifestação
        </button>
      </div>

      {/* Tabela de tickets */}
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        role="region"
        aria-label="Lista de manifestações"
      >
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true" />
            Carregando manifestações...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <FileText size={48} className="text-gray-300 mb-4" aria-hidden="true" />
            <p className="text-lg font-medium text-gray-900 mb-1">Nenhuma manifestação encontrada</p>
            <p className="text-sm">
              {searchTerm
                ? 'Nenhum resultado para esta busca.'
                : isServidor
                  ? 'A caixa de entrada da Ouvidoria está vazia.'
                  : 'Você ainda não enviou nenhuma solicitação.'}
            </p>
            {!isServidor && !searchTerm && (
              <button
                onClick={() => setShowNovaModal(true)}
                className="btn-primary mt-4 flex items-center gap-2 text-sm"
              >
                <MessageSquarePlus size={15} aria-hidden="true" /> Nova Manifestação
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" aria-label="Manifestações da ouvidoria">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="p-4 font-medium text-sm text-gray-600">Protocolo</th>
                  <th scope="col" className="p-4 font-medium text-sm text-gray-600">Assunto</th>
                  <th scope="col" className="p-4 font-medium text-sm text-gray-600">Data</th>
                  {isServidor && <th scope="col" className="p-4 font-medium text-sm text-gray-600">Prazo (LAI)</th>}
                  <th scope="col" className="p-4 font-medium text-sm text-gray-600">Status</th>
                  <th scope="col" className="p-4 font-medium text-sm text-gray-600">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(ticket => {
                  const dataCriacao = new Date(ticket.created_at).toLocaleDateString('pt-BR')
                  const diasRestantes = Math.ceil(
                    (new Date(ticket.prazo_vencimento).getTime() - Date.now()) / 86400000
                  )

                  let slaBadge: React.ReactNode = null
                  if (isServidor && ticket.status !== 'concluido' && ticket.status !== 'arquivado') {
                    if (diasRestantes < 0) {
                      slaBadge = (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertCircle size={12} aria-hidden="true" /> Vencido ({Math.abs(diasRestantes)}d)
                        </span>
                      )
                    } else if (diasRestantes <= 5) {
                      slaBadge = (
                        <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          <Clock size={12} aria-hidden="true" /> Restam {diasRestantes}d
                        </span>
                      )
                    } else {
                      slaBadge = <span className="text-xs text-gray-500">{diasRestantes} dias</span>
                    }
                  } else if (isServidor) {
                    slaBadge = (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} aria-hidden="true" /> Concluído
                      </span>
                    )
                  }

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-sm font-mono font-medium text-gray-900">
                        {ticket.protocolo}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.assunto}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          {TIPO_LABELS[ticket.tipo as OuvidoriaTipo] ?? ticket.tipo.replace('_', ' ')}
                          {ticket.sigiloso && <Lock size={10} className="text-gray-400" aria-label="Sigiloso" />}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{dataCriacao}</td>
                      {isServidor && <td className="p-4">{slaBadge}</td>}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[ticket.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABEL[ticket.status] ?? ticket.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setTicketDetalheId(ticket.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-2 py-1"
                          aria-label={`Ver detalhes da manifestação ${ticket.protocolo}`}
                        >
                          <Eye size={14} aria-hidden="true" /> Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNovaModal && (
        <NovaManifestacaoModal
          onClose={() => setShowNovaModal(false)}
          onSuccess={() => fetchTickets()}
        />
      )}

      {ticketDetalheId && (
        <TicketDetalheDrawer
          ticketId={ticketDetalheId}
          isServidor={isServidor}
          onClose={() => setTicketDetalheId(null)}
          onStatusChange={() => { fetchTickets(); setTicketDetalheId(null) }}
        />
      )}
    </div>
  )
}
