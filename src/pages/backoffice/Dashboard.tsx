import { useNavigate } from 'react-router-dom'
import { FileText, Gavel, Users, TrendingUp, ChevronRight, Calendar, Play } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'

const TIPO_SIGLAS: Record<string, string> = {
  projeto_lei: 'PL', projeto_lei_complementar: 'PLC', projeto_resolucao: 'PR',
  requerimento: 'REQ', indicacao: 'IND', moca_aplausos: 'MOC', voto_pesar: 'VP',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  rascunho:      { label: 'Rascunho',       color: 'text-gray-500' },
  protocolado:   { label: 'Protocolado',    color: 'text-blue-600' },
  em_tramitacao: { label: 'Em Tramitação',  color: 'text-yellow-600' },
  em_comissao:   { label: 'Em Comissão',    color: 'text-orange-600' },
  em_votacao:    { label: 'Em Votação',     color: 'text-purple-600' },
  aprovado:      { label: 'Aprovado',       color: 'text-green-600' },
  rejeitado:     { label: 'Rejeitado',      color: 'text-red-600' },
  arquivado:     { label: 'Arquivado',      color: 'text-gray-400' },
  sancionado:    { label: 'Sancionado',     color: 'text-emerald-600' },
  vetado:        { label: 'Vetado',         color: 'text-red-500' },
}

const TIPO_SESSAO: Record<string, string> = {
  ordinaria: 'Sessão Ordinária', extraordinaria: 'Sessão Extraordinária',
  especial: 'Sessão Especial', solene: 'Sessão Solene',
}

export function Dashboard() {
  const { profile } = useAuth()
  const { stats, recentes, proximaSessao, loading } = useDashboard()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const statCards = [
    { label: 'Proposições em Tramitação', value: stats.proposicoesEmTramitacao, icon: FileText,   color: 'text-blue-600 bg-blue-50' },
    { label: 'Sessões neste mês',         value: stats.sessoesNoMes,            icon: Gavel,      color: 'text-purple-600 bg-purple-50' },
    { label: 'Vereadores Ativos',         value: stats.vereadores,              icon: Users,      color: 'text-green-600 bg-green-50' },
    { label: 'Aprovadas este ano',        value: stats.leisAprovadas,           icon: TrendingUp, color: 'text-accent bg-yellow-50' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`${greeting}, ${profile?.nome.split(' ')[0] ?? 'Usuário'}`}
        description="Resumo da atividade legislativa"
      />
      <div className="flex-1 p-8 space-y-8 overflow-auto">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map(stat => (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                {loading
                  ? <div className="h-7 w-10 bg-gray-200 animate-pulse rounded mb-1" />
                  : <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                }
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Proposições Recentes</h2>
              <button onClick={() => navigate('/backoffice/legislativo')} className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
                Ver todas <ChevronRight size={12} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}</div>
            ) : recentes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma proposição cadastrada</p>
                <button onClick={() => navigate('/backoffice/legislativo/nova')} className="btn-primary mt-3 text-xs">Criar primeira</button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentes.map(p => {
                  const st = STATUS_LABELS[p.status]
                  return (
                    <button key={p.id} onClick={() => navigate(`/backoffice/legislativo/${p.id}`)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                      <span className="badge bg-primary-50 text-primary-700 font-mono text-xs mt-0.5 flex-shrink-0">
                        {TIPO_SIGLAS[p.tipo] ?? p.tipo} {p.numero}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-1">{p.ementa}</p>
                        <p className={`text-xs mt-0.5 ${st?.color ?? 'text-gray-400'}`}>{st?.label ?? p.status}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Plenário</h2>
              <button onClick={() => navigate('/backoffice/plenario')} className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
                Ver sessões <ChevronRight size={12} />
              </button>
            </div>
            {loading ? (
              <div className="h-32 bg-gray-100 animate-pulse rounded-xl" />
            ) : proximaSessao ? (
              <div
                onClick={() => navigate(
                  proximaSessao.status === 'em_andamento'
                    ? `/backoffice/plenario/${proximaSessao.id}`
                    : `/backoffice/plenario/${proximaSessao.id}/gerenciar`
                )}
                className={`rounded-xl p-5 cursor-pointer transition-colors ${
                  proximaSessao.status === 'em_andamento'
                    ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                    : 'bg-primary-50 border border-primary-200 hover:bg-primary-100'
                }`}
              >
                {proximaSessao.status === 'em_andamento' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-200 px-2 py-0.5 rounded-full mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> Ao Vivo
                  </span>
                )}
                <p className="font-semibold text-gray-900">
                  {TIPO_SESSAO[proximaSessao.tipo] ?? proximaSessao.tipo} nº {proximaSessao.numero}/{proximaSessao.ano}
                </p>
                <p className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                  <Calendar size={13} />
                  {new Date(proximaSessao.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
                  proximaSessao.status === 'em_andamento' ? 'text-green-700' : 'text-primary-700'
                }`}>
                  <Play size={13} />
                  {proximaSessao.status === 'em_andamento' ? 'Entrar na sessão' : 'Gerenciar pauta'}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Gavel size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma sessão agendada</p>
                <button onClick={() => navigate('/backoffice/plenario')} className="btn-secondary mt-3 text-xs">Agendar sessão</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
