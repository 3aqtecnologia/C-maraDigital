import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useLeis } from '@/hooks/useLeis'
import type { LeiStatus } from '@/types/database'
import { BookOpen, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const STATUS_CONFIG: Record<LeiStatus, { label: string; color: string; bg: string }> = {
  em_vigor: { label: 'Em Vigor', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  revogada_parcialmente: { label: 'Revogada Parcialmente', color: 'text-amber-700', bg: 'bg-amber-100' },
  revogada_totalmente: { label: 'Revogada Totalmente', color: 'text-red-700', bg: 'bg-red-100' },
}

export function LeisList() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { leis, loading, fetchLeis } = useLeis()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeis(search)
  }, [search, fetchLeis])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'servidor'

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Compilação de Leis (LeisGov)"
        description="Gestão, consulta e consolidação do acervo de Leis do Município."
        actions={
          isAdmin && (
            <Link to="/backoffice/leis/nova" className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Nova Lei</span>
            </Link>
          )
        }
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por número, ano, ementa ou esfera..."
                className="input pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Buscando leis...</div>
            ) : leis.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <BookOpen size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma lei encontrada</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  {search ? 'Tente ajustar sua busca.' : 'O acervo legislativo ainda está vazio.'}
                </p>
                {isAdmin && !search && (
                  <Link to="/backoffice/leis/nova" className="btn-primary">
                    Criar primeira lei
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
                    <tr>
                      <th className="px-6 py-4">Lei / Ano</th>
                      <th className="px-6 py-4">Esfera</th>
                      <th className="px-6 py-4 w-full">Ementa</th>
                      <th className="px-6 py-4">Data Publicação</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leis.map(lei => {
                      const st = STATUS_CONFIG[lei.status]
                      return (
                        <tr
                          key={lei.id}
                          onClick={() => navigate(`/backoffice/leis/${lei.id}`)}
                          className="hover:bg-primary-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                            {lei.numero}/{lei.ano}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {lei.esfera}
                          </td>
                          <td className="px-6 py-4 text-gray-600 truncate max-w-sm whitespace-normal leading-snug">
                            {lei.ementa}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`badge ${st.bg} ${st.color} px-2.5 py-1 text-xs`}>
                              {st.label}
                            </span>
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
      </div>
    </div>
  )
}
