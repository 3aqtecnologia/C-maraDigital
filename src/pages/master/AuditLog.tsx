import { useEffect, useState } from 'react'
import { ScrollText, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type AuditRow = Database['public']['Tables']['tenant_audit_log']['Row']

const ACAO_CONFIG: Record<string, { label: string; color: string }> = {
  tenant_provisionado: { label: 'Tenant Provisionado', color: 'text-green-400 bg-green-900/30' },
  tenant_suspenso:     { label: 'Tenant Suspenso',     color: 'text-red-400 bg-red-900/30' },
  tenant_reativado:    { label: 'Tenant Reativado',    color: 'text-blue-400 bg-blue-900/30' },
  plano_alterado:      { label: 'Plano Alterado',      color: 'text-yellow-400 bg-yellow-900/30' },
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tenant_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs(data ?? [])
        setLoading(false)
      })
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full text-gray-100">
      <div className="px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScrollText size={22} className="text-indigo-400" />
          Audit Log
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Registro imutável de todas as ações administrativas</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield size={28} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum evento registrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Data/Hora</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Ação</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider hidden md:table-cell">Detalhes</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {logs.map(log => {
                  const cfg = ACAO_CONFIG[log.acao] ?? { label: log.acao, color: 'text-gray-400 bg-gray-700' }
                  return (
                    <tr key={log.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-xs font-mono whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                        {log.detalhes ? (
                          <span className="font-mono">
                            {(log.detalhes as Record<string, string>)['nome'] ?? JSON.stringify(log.detalhes)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs font-mono hidden lg:table-cell">
                        {log.ip_address ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
