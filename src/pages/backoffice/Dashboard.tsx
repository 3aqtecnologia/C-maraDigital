import { FileText, Gavel, Users, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'

const stats = [
  { label: 'Proposições em Tramitação', value: '24', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { label: 'Sessões neste mês', value: '3', icon: Gavel, color: 'text-purple-600 bg-purple-50' },
  { label: 'Vereadores Ativos', value: '11', icon: Users, color: 'text-green-600 bg-green-50' },
  { label: 'Leis Aprovadas (ano)', value: '47', icon: TrendingUp, color: 'text-accent bg-yellow-50' },
]

export function Dashboard() {
  const { profile } = useAuth()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`${greeting}, ${profile?.nome.split(' ')[0] ?? 'Usuário'}`}
        description="Aqui está um resumo da atividade legislativa"
      />

      <div className="flex-1 p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map(stat => (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`rounded-xl p-3 ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Proposições Recentes</h2>
            <div className="space-y-3">
              {[
                { num: 'PL 012/2025', ementa: 'Dispõe sobre a criação do conselho municipal de cultura', status: 'Em tramitação' },
                { num: 'REQ 034/2025', ementa: 'Requer informações sobre obras da avenida principal', status: 'Protocolado' },
                { num: 'PL 011/2025', ementa: 'Institui o programa de incentivo ao esporte escolar', status: 'Em votação' },
              ].map(p => (
                <div key={p.num} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <span className="badge bg-primary-50 text-primary-700 font-mono text-xs mt-0.5">{p.num}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-1">{p.ementa}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Próxima Sessão</h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                <Gavel size={28} className="text-primary-600" />
              </div>
              <p className="font-semibold text-gray-900">Sessão Ordinária</p>
              <p className="text-gray-500 text-sm mt-1">Nenhuma sessão agendada</p>
              <button className="btn-primary mt-4 text-sm">
                Agendar Sessão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
