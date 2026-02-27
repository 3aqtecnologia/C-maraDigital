import { PageHeader } from '@/components/layout/PageHeader'
import { useTeletrabalho } from '@/hooks/useTeletrabalho'
import type { TeletrabalhoComNome } from '@/hooks/useTeletrabalho'
import type { TeletrabalhoStatus } from '@/types/database'
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const STATUS_BADGE: Record<TeletrabalhoStatus, { label: string; className: string }> = {
  pendente:  { label: 'Pendente',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  aprovado:  { label: 'Aprovado',  className: 'bg-green-50 text-green-700 border-green-200' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-50 text-red-600 border-red-200' },
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function horasDecorridas(inicio?: string | null, fim?: string | null): string {
  if (!inicio || !fim) return '—'
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fim.split(':').map(Number)
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (totalMin <= 0) return '—'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

interface NovoRegistroFormProps {
  onClose: () => void
  onSuccess: () => void
  registrar: ReturnType<typeof useTeletrabalho>['registrarTeletrabalho']
}

function NovoRegistroForm({ onClose, onSuccess, registrar }: NovoRegistroFormProps) {
  const hoje = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(hoje)
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFim, setHoraFim] = useState('17:00')
  const [atividades, setAtividades] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!atividades.trim()) return
    setError(null)
    const toMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm }
    if (toMin(horaFim) <= toMin(horaInicio)) {
      setError('O horário de fim deve ser posterior ao horário de início.')
      return
    }
    setSaving(true)
    const { error: err } = await registrar({
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      atividades,
    })
    setSaving(false)
    if (err) {
      setError(err.includes('unique') ? 'Já existe um registro para esta data.' : err)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Registrar Teletrabalho</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
            <input
              type="date"
              className="input"
              value={data}
              onChange={e => setData(e.target.value)}
              max={hoje}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Início</label>
              <input
                type="time"
                className="input"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fim</label>
              <input
                type="time"
                className="input"
                value={horaFim}
                onChange={e => setHoraFim(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Atividades realizadas *</label>
            <textarea
              className="input resize-none"
              rows={4}
              value={atividades}
              onChange={e => setAtividades(e.target.value)}
              placeholder="Descreva as atividades desenvolvidas durante o teletrabalho..."
              required
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
              disabled={saving || !atividades.trim()}
              className="btn-primary flex-1 justify-center flex items-center gap-2"
            >
              {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AvaliarModalProps {
  registro: TeletrabalhoComNome
  onClose: () => void
  onSuccess: () => void
  avaliar: ReturnType<typeof useTeletrabalho>['atualizarStatus']
}

function AvaliarModal({ registro, onClose, onSuccess, avaliar }: AvaliarModalProps) {
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  async function handle(status: TeletrabalhoStatus) {
    setSaving(true)
    await avaliar(registro.id, status, obs || undefined)
    setSaving(false)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Avaliar Registro</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-gray-500">Servidor:</span> <span className="font-medium">{registro.profiles?.nome ?? '—'}</span></p>
            <p><span className="text-gray-500">Data:</span> {formatDate(registro.data)}</p>
            <p><span className="text-gray-500">Horário:</span> {registro.hora_inicio ?? '—'} – {registro.hora_fim ?? '—'}</p>
            <p><span className="text-gray-500">Atividades:</span> {registro.atividades}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação (opcional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Motivo do indeferimento ou observação..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handle('rejeitado')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <XCircle size={15} /> Indeferir
            </button>
            <button
              onClick={() => handle('aprovado')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Deferir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Teletrabalho() {
  const {
    registros, loading, isAdmin,
    fetchRegistros, registrarTeletrabalho, atualizarStatus, deletarRegistro,
  } = useTeletrabalho()

  const [filtroStatus, setFiltroStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [avaliarRegistro, setAvaliarRegistro] = useState<TeletrabalhoComNome | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRegistros(filtroStatus)
  }, [fetchRegistros, filtroStatus])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro?')) return
    setDeletingId(id)
    await deletarRegistro(id)
    await fetchRegistros(filtroStatus)
    setDeletingId(null)
  }

  const pendentesCount = registros.filter(r => r.status === 'pendente').length

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Teletrabalho"
        description="Registro e acompanhamento de jornada em teletrabalho"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={15} />
            Registrar Dia
          </button>
        }
      />

      <div className="flex-1 p-6 overflow-auto space-y-5">
        {/* Filtro de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { value: '', label: 'Todos' },
            { value: 'pendente', label: `Pendentes${isAdmin && pendentesCount ? ` (${pendentesCount})` : ''}` },
            { value: 'aprovado', label: 'Aprovados' },
            { value: 'rejeitado', label: 'Indeferidos' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtroStatus === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary-500" />
          </div>
        ) : registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Clock size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Nenhum registro encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em "Registrar Dia" para lançar um dia de teletrabalho.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {registros.map(r => {
              const badge = STATUS_BADGE[r.status]
              return (
                <div key={r.id} className="card flex items-start gap-4 hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{formatDate(r.data)}</span>
                      {isAdmin && r.profiles && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <UserCheck size={12} /> {r.profiles.nome}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      {r.hora_inicio && r.hora_fim && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          {r.hora_inicio.slice(0, 5)} – {r.hora_fim.slice(0, 5)}
                          <span className="text-gray-400">({horasDecorridas(r.hora_inicio, r.hora_fim)})</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{r.atividades}</p>
                    {r.obs_gestor && (
                      <p className="text-xs text-gray-400 mt-1 italic">Obs. gestor: {r.obs_gestor}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && r.status === 'pendente' && (
                      <button
                        onClick={() => setAvaliarRegistro(r)}
                        title="Avaliar"
                        className="p-2 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <ChevronDown size={15} /> Avaliar
                      </button>
                    )}
                    {r.status === 'pendente' && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        title="Excluir"
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        {deletingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <NovoRegistroForm
          onClose={() => setShowForm(false)}
          onSuccess={() => fetchRegistros(filtroStatus)}
          registrar={registrarTeletrabalho}
        />
      )}

      {avaliarRegistro && (
        <AvaliarModal
          registro={avaliarRegistro}
          onClose={() => setAvaliarRegistro(null)}
          onSuccess={() => fetchRegistros(filtroStatus)}
          avaliar={atualizarStatus}
        />
      )}
    </div>
  )
}
