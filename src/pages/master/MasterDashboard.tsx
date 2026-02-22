import { supabase } from '@/lib/supabase'
import type { Database, TenantSituacao } from '@/types/database'
import { AlertTriangle, Building2, CheckCircle2, FileText, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type TenantOverview = Database['public']['Views']['master_tenant_overview']['Row']

const SITUACAO_CONFIG: Record<TenantSituacao, { label: string; color: string; dot: string }> = {
  ativo: { label: 'Ativo', color: 'text-green-400 bg-green-900/30', dot: 'bg-green-500' },
  trial: { label: 'Trial', color: 'text-yellow-400 bg-yellow-900/30', dot: 'bg-yellow-500' },
  suspenso: { label: 'Suspenso', color: 'text-red-400 bg-red-900/30', dot: 'bg-red-500' },
  cancelado: { label: 'Cancelado', color: 'text-gray-500 bg-gray-800', dot: 'bg-gray-500' },
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  )
}

export function MasterDashboard() {
  const [tenants, setTenants] = useState<TenantOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('master_tenant_overview')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTenants(data ?? [])
        setLoading(false)
      })
  }, [])

  const ativos = tenants.filter(t => t.situacao === 'ativo').length
  const trials = tenants.filter(t => t.situacao === 'trial').length
  const suspensos = tenants.filter(t => t.situacao === 'suspenso').length
  const totalUsuarios = tenants.reduce((sum, t) => sum + (t.usuarios_ativos ?? 0), 0)

  return (
    <div className="flex flex-col h-full text-gray-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Dashboard Master</h1>
        <p className="text-gray-400 text-sm mt-0.5">Visão consolidada da infraestrutura SaaS</p>
      </div>

      <div className="flex-1 p-8 space-y-8 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Câmaras Totais" value={tenants.length} icon={Building2} color="bg-indigo-600/20 text-indigo-400" />
          <StatCard label="Câmaras Ativas" value={ativos} icon={CheckCircle2} color="bg-green-600/20 text-green-400" />
          <StatCard label="Em Trial" value={trials} icon={TrendingUp} color="bg-yellow-600/20 text-yellow-400" />
          <StatCard label="Usuários Totais" value={totalUsuarios} icon={Users} color="bg-purple-600/20 text-purple-400" />
        </div>

        {/* Alertas */}
        {suspensos > 0 && (
          <div className="flex items-center gap-3 bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-red-300">
            <AlertTriangle size={18} className="flex-shrink-0 text-red-400" />
            <p className="text-sm">
              <span className="font-semibold">{suspensos} câmara(s) suspensa(s)</span> — verifique pendências de pagamento ou suporte.
            </p>
          </div>
        )}

        {/* Tabela de tenants */}
        <div>
          <h2 className="text-gray-200 font-semibold mb-4">Câmaras Municipais</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-pulse">Carregando câmaras...</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Câmara</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider hidden md:table-cell">Plano</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Situação</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider hidden lg:table-cell">Usuários</th>
                    <th className="px-5 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider hidden lg:table-cell">Proposições</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {tenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                        <Building2 size={28} className="mx-auto mb-2 opacity-30" />
                        <p>Nenhuma câmara cadastrada</p>
                      </td>
                    </tr>
                  ) : tenants.map(t => {
                    const situacao = t.situacao ?? 'ativo'
                    const cfg = SITUACAO_CONFIG[situacao as TenantSituacao]
                    return (
                      <tr key={t.id} className="hover:bg-gray-750 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                              <Building2 size={14} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-gray-100 font-medium">{t.nome}</p>
                              <p className="text-gray-500 text-xs">{t.municipio}/{t.uf}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="capitalize text-gray-300">{t.plano ?? '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-gray-400 hidden lg:table-cell">
                          {t.usuarios_ativos} / {t.max_usuarios ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-400 hidden lg:table-cell">
                          {t.total_proposicoes}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Provisionar nova Câmara', icon: Building2, to: '/master/provisionar', color: 'bg-indigo-600 hover:bg-indigo-700' },
            { label: 'Ver Audit Log', icon: FileText, to: '/master/audit', color: 'bg-gray-700 hover:bg-gray-600' },
            { label: 'Configurações Globais', icon: TrendingUp, to: '/master/configuracoes', color: 'bg-gray-700 hover:bg-gray-600' },
          ].map(action => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl text-white font-medium text-sm transition-colors ${action.color}`}
            >
              <action.icon size={18} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
