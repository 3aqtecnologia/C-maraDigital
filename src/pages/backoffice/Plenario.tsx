import { Gavel, Play, Users, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import type { SessaoStatus } from '@/types/database'

const STATUS_CONFIG: Record<SessaoStatus, { label: string; color: string; dot: string }> = {
  agendada:     { label: 'Agendada',     color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  em_andamento: { label: 'Em andamento', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500 animate-pulse' },
  encerrada:    { label: 'Encerrada',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  cancelada:    { label: 'Cancelada',    color: 'bg-red-100 text-red-600',      dot: 'bg-red-400' },
}

const MOCK_SESSOES = [
  { id: '1', tipo: 'Sessão Ordinária', numero: '003/2025', data: '25/02/2025', hora: '14:00', status: 'agendada' as SessaoStatus, quorum: '7/11' },
  { id: '2', tipo: 'Sessão Ordinária', numero: '002/2025', data: '11/02/2025', hora: '14:00', status: 'encerrada' as SessaoStatus, quorum: '9/11' },
  { id: '3', tipo: 'Sessão Extraordinária', numero: '001-E/2025', data: '05/02/2025', hora: '10:00', status: 'encerrada' as SessaoStatus, quorum: '11/11' },
]

export function Plenario() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Plenário e Votação"
        description="Gestão de sessões, ordem do dia e votações eletrônicas"
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Gavel size={16} />
            Nova Sessão
          </button>
        }
      />

      <div className="flex-1 p-8 space-y-6">
        {/* Painel de sessão ativa */}
        <div className="card bg-primary-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-300 text-sm">Próxima sessão</p>
              <h2 className="text-xl font-bold mt-1">Sessão Ordinária nº 003/2025</h2>
              <div className="flex items-center gap-4 mt-2 text-primary-200 text-sm">
                <span className="flex items-center gap-1.5"><Clock size={14} /> 25/02/2025 às 14:00</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> Quórum mínimo: 6</span>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-white text-primary-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors">
              <Play size={16} />
              Iniciar Sessão
            </button>
          </div>
        </div>

        {/* Lista de sessões */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Sessões Legislativas</h2>
          <div className="space-y-3">
            {MOCK_SESSOES.map(sessao => {
              const config = STATUS_CONFIG[sessao.status]
              return (
                <div key={sessao.id} className="card hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Gavel size={18} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{sessao.tipo} — {sessao.numero}</p>
                      <span className={`badge ${config.color} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {sessao.data} às {sessao.hora} · Quórum: {sessao.quorum}
                    </p>
                  </div>
                  <button className="btn-secondary text-sm flex-shrink-0">
                    Ver detalhes
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
