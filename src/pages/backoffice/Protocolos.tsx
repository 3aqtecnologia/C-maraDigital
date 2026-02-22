import { PageHeader } from '@/components/layout/PageHeader'
import { useProtocolos } from '@/hooks/useProtocolos'
import type { Protocolo, ProtocoloStatus, ProtocoloTipo } from '@/hooks/useProtocolos'
import { useAuth } from '@/hooks/useAuth'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const STATUS_BADGE: Record<ProtocoloStatus, { label: string; className: string }> = {
  pendente:      { label: 'Pendente',       className: 'bg-amber-50 text-amber-700 border-amber-200' },
  em_tramitacao: { label: 'Em tramitação',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  concluido:     { label: 'Concluído',      className: 'bg-green-50 text-green-700 border-green-200' },
  arquivado:     { label: 'Arquivado',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const STATUS_FLOW: ProtocoloStatus[] = ['pendente', 'em_tramitacao', 'concluido', 'arquivado']

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

interface NovoProtocoloModalProps {
  onClose: () => void
  onSuccess: () => void
  criar: ReturnType<typeof useProtocolos>['criarProtocolo']
}

function NovoProtocoloModal({ onClose, onSuccess, criar }: NovoProtocoloModalProps) {
  const hoje = new Date().toISOString().split('T')[0]
  const [tipo, setTipo] = useState<ProtocoloTipo>('entrada')
  const [assunto, setAssunto] = useState('')
  const [remetente, setRemetente] = useState('')
  const [destinatario, setDestinatario] = useState('')
  const [dataRecebimento, setDataRecebimento] = useState(hoje)
  const [prazo, setPrazo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error: err } = await criar({
      tipo,
      assunto,
      remetente: remetente || undefined,
      destinatario: destinatario || undefined,
      data_recebimento: dataRecebimento,
      prazo: prazo || undefined,
      observacoes: observacoes || undefined,
    })
    setSaving(false)
    if (err) {
      setError(err)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">Novo Protocolo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['entrada', 'saida'] as ProtocoloTipo[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    tipo === t
                      ? t === 'entrada'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t === 'entrada'
                    ? <><ArrowDownCircle size={16} /> Entrada</>
                    : <><ArrowUpCircle size={16} /> Saída</>
                  }
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto *</label>
            <input
              className="input"
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              required
              placeholder="Ex: Solicitação de informações orçamentárias"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tipo === 'entrada' ? 'Remetente' : 'Destinatário (origem)'}
              </label>
              <input
                className="input"
                value={remetente}
                onChange={e => setRemetente(e.target.value)}
                placeholder="Nome ou órgão"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tipo === 'saida' ? 'Destinatário' : 'Encaminhar para'}
              </label>
              <input
                className="input"
                value={destinatario}
                onChange={e => setDestinatario(e.target.value)}
                placeholder="Nome ou setor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
              <input
                type="date"
                className="input"
                value={dataRecebimento}
                onChange={e => setDataRecebimento(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo de resposta</label>
              <input
                type="date"
                className="input"
                value={prazo}
                onChange={e => setPrazo(e.target.value)}
                min={dataRecebimento}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !assunto.trim()}
              className="btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Protocolar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StatusMenuProps {
  protocolo: Protocolo
  onUpdate: (status: ProtocoloStatus) => Promise<void>
}

function StatusMenu({ protocolo, onUpdate }: StatusMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const outros = STATUS_FLOW.filter(s => s !== protocolo.status)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
        title="Alterar status"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
          {outros.map(s => {
            const badge = STATUS_BADGE[s]
            return (
              <button
                key={s}
                onClick={async () => { setOpen(false); await onUpdate(s) }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Protocolos() {
  const { profile } = useAuth()
  const { protocolos, loading, fetchProtocolos, criarProtocolo, atualizarStatus, deletarProtocolo } = useProtocolos()

  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'servidor'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    fetchProtocolos(search, tipoFiltro, statusFiltro)
  }, [fetchProtocolos, search, tipoFiltro, statusFiltro])

  async function handleStatusUpdate(id: string, status: ProtocoloStatus) {
    await atualizarStatus(id, status)
    await fetchProtocolos(search, tipoFiltro, statusFiltro)
  }

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`Excluir protocolo ${numero}? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    await deletarProtocolo(id)
    await fetchProtocolos(search, tipoFiltro, statusFiltro)
    setDeletingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Protocolo"
        description="Controle de documentos e correspondências externas"
        actions={
          canEdit ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={15} />
              Novo Protocolo
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por assunto, número ou remetente..."
              className="input pl-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 flex-shrink-0" />
            <select
              className="input text-sm py-2"
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
            >
              <option value="">Entrada e Saída</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
            <select
              className="input text-sm py-2"
              value={statusFiltro}
              onChange={e => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_BADGE).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : protocolos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <ClipboardList size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Nenhum protocolo encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || tipoFiltro || statusFiltro ? 'Tente ajustar os filtros.' : 'Clique em "Novo Protocolo" para registrar.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {protocolos.map(p => {
              const badge = STATUS_BADGE[p.status]
              const prazoVencido = p.prazo && new Date(p.prazo) < new Date() && p.status !== 'concluido' && p.status !== 'arquivado'

              return (
                <div key={p.id} className="card flex items-start gap-4 hover:shadow-sm transition-shadow">
                  {/* Ícone tipo */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.tipo === 'entrada' ? 'bg-green-50' : 'bg-blue-50'
                  }`}>
                    {p.tipo === 'entrada'
                      ? <ArrowDownCircle size={18} className="text-green-600" />
                      : <ArrowUpCircle size={18} className="text-blue-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-gray-500">
                        {String(p.numero).padStart(4, '0')}/{p.ano}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      {prazoVencido && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-red-50 text-red-600 border-red-200">
                          Prazo vencido
                        </span>
                      )}
                    </div>

                    {/* Assunto */}
                    <p className="text-sm font-medium text-gray-900 mt-1">{p.assunto}</p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                      <span>Data: {formatDate(p.data_recebimento)}</span>
                      {p.remetente && <span>De: {p.remetente}</span>}
                      {p.destinatario && <span>Para: {p.destinatario}</span>}
                      {p.prazo && (
                        <span className={prazoVencido ? 'text-red-500 font-medium' : ''}>
                          Prazo: {formatDate(p.prazo)}
                        </span>
                      )}
                    </div>

                    {p.observacoes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{p.observacoes}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canEdit && (
                      <StatusMenu
                        protocolo={p}
                        onUpdate={(status) => handleStatusUpdate(p.id, status)}
                      />
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(p.id, `${p.numero}/${p.ano}`)}
                        disabled={deletingId === p.id}
                        title="Excluir"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && protocolos.length > 0 && (
          <p className="text-xs text-gray-400 text-center">
            {protocolos.length} protocolo{protocolos.length !== 1 ? 's' : ''} encontrado{protocolos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {showModal && (
        <NovoProtocoloModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchProtocolos(search, tipoFiltro, statusFiltro)}
          criar={criarProtocolo}
        />
      )}
    </div>
  )
}
