import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, Play, Users, Clock, Plus, AlertCircle, RefreshCw, Radio, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessoes } from '@/hooks/useSessoes'
import { useAuth } from '@/hooks/useAuth'
import type { SessaoStatus, SessaoTipo } from '@/types/database'

const STATUS_CONFIG: Record<SessaoStatus, { label: string; color: string; dot: string }> = {
  agendada:     { label: 'Agendada',     color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  em_andamento: { label: 'Em andamento', color: 'bg-green-100 text-green-700', dot: 'bg-green-500 animate-pulse' },
  encerrada:    { label: 'Encerrada',    color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  cancelada:    { label: 'Cancelada',    color: 'bg-red-100 text-red-600',     dot: 'bg-red-400' },
}

const TIPO_LABELS: Record<SessaoTipo, string> = {
  ordinaria:     'Sessão Ordinária',
  extraordinaria:'Sessão Extraordinária',
  especial:      'Sessão Especial',
  solene:        'Sessão Solene',
}

export function Plenario() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { sessoes, loading, error, fetch, criar, iniciar } = useSessoes()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'ordinaria' as SessaoTipo,
    data_inicio: '',
    local: 'Câmara Municipal',
    quorum_minimo: 6,
  })
  const [saving, setSaving] = useState(false)

  const sessaoAtiva = sessoes.find(s => s.status === 'em_andamento')
  const proxima = sessoes.find(s => s.status === 'agendada')

  async function handleCriar() {
    if (!formData.data_inicio || !formData.local) return
    setSaving(true)
    const result = await criar(formData)
    setSaving(false)
    if (result) {
      setShowForm(false)
      setFormData({ tipo: 'ordinaria', data_inicio: '', local: 'Câmara Municipal', quorum_minimo: 6 })
    }
  }

  async function handleIniciar(id: string) {
    await iniciar(id)
    navigate(`/backoffice/plenario/${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Plenário e Votação"
        description="Gestão de sessões, ordem do dia e votações eletrônicas"
        actions={
          isAdmin ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Nova Sessão
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 p-8 space-y-6 overflow-auto">

        {/* Modal Nova Sessão */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Nova Sessão</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Sessão</label>
                  <select
                    className="input"
                    value={formData.tipo}
                    onChange={e => setFormData(f => ({ ...f, tipo: e.target.value as SessaoTipo }))}
                  >
                    {(Object.entries(TIPO_LABELS) as [SessaoTipo, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data e Hora</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.data_inicio}
                    onChange={e => setFormData(f => ({ ...f, data_inicio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Local</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.local}
                    onChange={e => setFormData(f => ({ ...f, local: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quórum Mínimo</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="input"
                    value={formData.quorum_minimo}
                    onChange={e => setFormData(f => ({ ...f, quorum_minimo: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button
                  onClick={handleCriar}
                  disabled={saving || !formData.data_inicio}
                  className="btn-primary flex-1 text-sm"
                >
                  {saving ? 'Criando...' : 'Criar Sessão'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessão ativa */}
        {sessaoAtiva && (
          <div
            className="card bg-primary-600 text-white border-0 cursor-pointer hover:bg-primary-700 transition-colors"
            onClick={() => navigate(`/backoffice/plenario/${sessaoAtiva.id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-300 text-sm flex items-center gap-1.5">
                  <Radio size={12} className="animate-pulse" />
                  Sessão em andamento
                </p>
                <h2 className="text-xl font-bold mt-1">
                  {TIPO_LABELS[sessaoAtiva.tipo]} nº {sessaoAtiva.numero}/{sessaoAtiva.ano}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-primary-200 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {sessaoAtiva.presentes.length} presentes · quórum {sessaoAtiva.quorum_minimo}
                  </span>
                  <span>{sessaoAtiva.local}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-white text-primary-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0">
                Entrar na Sessão
              </button>
            </div>
          </div>
        )}

        {/* Próxima sessão agendada */}
        {!sessaoAtiva && proxima && isAdmin && (
          <div className="card bg-primary-50 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-600 text-sm">Próxima sessão</p>
                <h2 className="text-lg font-bold text-primary-800 mt-0.5">
                  {TIPO_LABELS[proxima.tipo]} nº {proxima.numero}/{proxima.ano}
                </h2>
                <div className="flex items-center gap-4 mt-1.5 text-primary-500 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {new Date(proxima.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="flex items-center gap-1.5"><Users size={13} /> Quórum: {proxima.quorum_minimo}</span>
                </div>
              </div>
              <button
                onClick={() => handleIniciar(proxima.id)}
                className="flex items-center gap-2 btn-primary text-sm flex-shrink-0"
              >
                <Play size={15} />
                Iniciar Sessão
              </button>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
            <AlertCircle size={17} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Lista */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Sessões Legislativas</h2>
            <button onClick={fetch} className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-500" title="Atualizar">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Carregando sessões...</p>
            </div>
          ) : sessoes.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Gavel size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma sessão cadastrada</p>
              {isAdmin && <p className="text-xs mt-1">Crie a primeira sessão clicando em "Nova Sessão"</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {sessoes.map(sessao => {
                const config = STATUS_CONFIG[sessao.status]
                return (
                  <div
                    key={sessao.id}
                    className="card hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                    onClick={() => sessao.status === 'em_andamento'
                      ? navigate(`/backoffice/plenario/${sessao.id}`)
                      : undefined
                    }
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Gavel size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">
                          {TIPO_LABELS[sessao.tipo]} — {sessao.numero}/{sessao.ano}
                        </p>
                        <span className={`badge ${config.color} flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(sessao.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {' · '}{sessao.local}
                        {' · '}{sessao.presentes.length}/{sessao.quorum_minimo} quórum
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {sessao.status === 'agendada' && isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); handleIniciar(sessao.id) }}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <Play size={12} />
                          Iniciar
                        </button>
                      )}
                      {sessao.status === 'em_andamento' && (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/backoffice/plenario/${sessao.id}`) }}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Entrar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
