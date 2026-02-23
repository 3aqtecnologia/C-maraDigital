import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useOuvidoria } from '@/hooks/useOuvidoria'
import { AlertCircle, CheckCircle2, Clock, FileText, MessageSquarePlus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Ouvidoria() {
  const { profile } = useAuth()
  const { tickets, loading, fetchTickets } = useOuvidoria()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const isServidor = profile?.role === 'admin' || profile?.role === 'servidor'

  const filteredTickets = tickets.filter(ticket =>
    ticket.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'novo': 'bg-blue-100 text-blue-800',
      'em_analise': 'bg-yellow-100 text-yellow-800',
      'respondido': 'bg-purple-100 text-purple-800',
      'concluido': 'bg-green-100 text-green-800',
      'arquivado': 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'novo': 'Novo',
      'em_analise': 'Em Análise',
      'respondido': 'Respondido',
      'concluido': 'Concluído',
      'arquivado': 'Arquivado',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ouvidoria & e-SIC"
        description={isServidor ? "Gestão de manifestações e pedidos de informação (LAI)." : "Acompanhe suas solicitações e pedidos de informação."}
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por protocolo, assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {!isServidor && (
          <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
            <MessageSquarePlus size={20} />
            Nova Manifestação
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Carregando manifestações...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <FileText size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-1">Nenhuma manifestação encontrada</p>
            <p className="text-sm">
              {isServidor ? "A caixa de entrada da Ouvidoria está vazia." : "Você ainda não enviou nenhuma solicitação."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-medium text-sm text-gray-600">Protocolo</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Assunto</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Data</th>
                  {isServidor && <th className="p-4 font-medium text-sm text-gray-600">Prazo (LAI)</th>}
                  <th className="p-4 font-medium text-sm text-gray-600">Status</th>
                  <th className="p-4 font-medium text-sm text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(ticket => {
                  const dataCriacao = new Date(ticket.created_at).toLocaleDateString('pt-BR')

                  // Calculo simples de dias restantes para o SLA
                  const vencimento = new Date(ticket.prazo_vencimento)
                  const agora = new Date()
                  const diffTime = vencimento.getTime() - agora.getTime()
                  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                  let slaBadge = null
                  if (isServidor && ticket.status !== 'concluido' && ticket.status !== 'arquivado') {
                    if (diasRestantes < 0) {
                      slaBadge = <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertCircle size={12} /> Vencido ({Math.abs(diasRestantes)}d)</span>
                    } else if (diasRestantes <= 5) {
                      slaBadge = <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Clock size={12} /> Restam {diasRestantes}d</span>
                    } else {
                      slaBadge = <span className="text-xs font-medium text-gray-500">{diasRestantes} dias</span>
                    }
                  } else if (isServidor) {
                    slaBadge = <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> No Prazo</span>
                  }

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {ticket.protocolo}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">{ticket.assunto}</div>
                        <div className="text-xs text-gray-500 capitalize">{ticket.tipo.replace('_', ' ')}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {dataCriacao}
                      </td>
                      {isServidor && (
                        <td className="p-4">
                          {slaBadge}
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver Detalhes
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
    </div>
  )
}
