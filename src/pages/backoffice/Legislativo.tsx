import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, FileText, RefreshCw, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProposicoes } from '@/hooks/useProposicoes'
import type { ProposicaoStatus } from '@/types/database'

const STATUS_LABELS: Record<ProposicaoStatus, { label: string; color: string }> = {
  rascunho:      { label: 'Rascunho',       color: 'bg-gray-100 text-gray-600' },
  protocolado:   { label: 'Protocolado',    color: 'bg-blue-100 text-blue-700' },
  em_tramitacao: { label: 'Em Tramitação',  color: 'bg-yellow-100 text-yellow-700' },
  em_comissao:   { label: 'Em Comissão',    color: 'bg-orange-100 text-orange-700' },
  em_votacao:    { label: 'Em Votação',     color: 'bg-purple-100 text-purple-700' },
  aprovado:      { label: 'Aprovado',       color: 'bg-green-100 text-green-700' },
  rejeitado:     { label: 'Rejeitado',      color: 'bg-red-100 text-red-700' },
  arquivado:     { label: 'Arquivado',      color: 'bg-gray-100 text-gray-500' },
  sancionado:    { label: 'Sancionado',     color: 'bg-emerald-100 text-emerald-700' },
  vetado:        { label: 'Vetado',         color: 'bg-red-100 text-red-600' },
}

export function Legislativo() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProposicaoStatus | 'todos'>('todos')

  const { proposicoes, loading, error, fetch } = useProposicoes(statusFilter)

  const filtered = proposicoes.filter(p => {
    const term = search.toLowerCase()
    return (
      p.ementa.toLowerCase().includes(term) ||
      p.numero.toLowerCase().includes(term) ||
      p.tipo.toLowerCase().includes(term)
    )
  })

  function formatNumero(p: typeof proposicoes[0]) {
    const siglas: Record<string, string> = {
      projeto_lei:             'PL',
      projeto_lei_complementar:'PLC',
      projeto_resolucao:       'PR',
      requerimento:            'REQ',
      indicacao:               'IND',
      moca_aplausos:           'MOC',
      voto_pesar:              'VP',
    }
    return `${siglas[p.tipo] ?? p.tipo} ${p.numero}/${p.ano}`
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Módulo Legislativo"
        description="Proposições, tramitações e processo eletrônico"
        actions={
          <button
            onClick={() => navigate('/backoffice/legislativo/nova')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Nova Proposição
          </button>
        }
      />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por número, ementa ou tipo..."
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 flex-shrink-0" />
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ProposicaoStatus | 'todos')}
            >
              <option value="todos">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={fetch}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-500"
              title="Atualizar"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
            <AlertCircle size={17} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabela */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Carregando proposições...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ementa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Autor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-gray-400">
                      <FileText size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium">Nenhuma proposição encontrada</p>
                      <p className="text-xs mt-1">Crie a primeira proposição clicando em "Nova Proposição"</p>
                    </td>
                  </tr>
                ) : filtered.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-primary-50/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/backoffice/legislativo/${p.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-primary-600 text-xs bg-primary-50 px-2 py-1 rounded">
                        {formatNumero(p)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 line-clamp-2 max-w-md leading-snug">{p.ementa}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                      {p.autor?.nome ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(p.data_protocolo).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${STATUS_LABELS[p.status].color}`}>
                        {STATUS_LABELS[p.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 text-right">
          {filtered.length} proposição(ões) · {proposicoes.length} total
        </p>
      </div>
    </div>
  )
}
