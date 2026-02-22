import { supabase } from '@/lib/supabase'
import type { Database, TenantSituacao } from '@/types/database'
import { Building2, MoreVertical, Search, Settings, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

type TenantOverview = Database['public']['Views']['master_tenant_overview']['Row']

const SITUACAO_LABELS: Record<TenantSituacao, string> = {
  ativo: 'Ativa',
  trial: 'Trial',
  suspenso: 'Suspensa',
  cancelado: 'Cancelada',
}

export function CamarasList() {
  const [camaras, setCamaras] = useState<TenantOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('master_tenant_overview')
      .select('*')
      .order('nome')
      .then(({ data }) => {
        setCamaras(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = camaras.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase()) ||
    c.municipio?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full text-gray-100">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Câmaras</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gerenciamento completo dos clientes da plataforma</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            placeholder="Buscar câmaras..."
            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500 animate-pulse">
              Carregando câmaras...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              Nenhuma câmara encontrada.
            </div>
          ) : filtered.map(camara => (
            <div key={camara.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
              <div className="p-5 border-b border-gray-700/50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-gray-100 font-semibold truncate" title={camara.nome || ''}>{camara.nome}</h3>
                    <p className="text-gray-400 text-xs">{camara.municipio}/{camara.uf}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-300 p-1">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Slug Base</span>
                  <span className="text-gray-300 font-mono text-xs">{camara.slug}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Plano</span>
                  <span className="text-indigo-400 font-medium capitalize">{camara.plano ?? 'Básico'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Situação</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${camara.situacao === 'ativo' ? 'bg-green-900/40 text-green-400' :
                      camara.situacao === 'trial' ? 'bg-yellow-900/40 text-yellow-400' :
                        camara.situacao === 'suspenso' ? 'bg-red-900/40 text-red-400' :
                          'bg-gray-700 text-gray-400'
                    }`}>
                    {SITUACAO_LABELS[(camara.situacao as TenantSituacao) || 'ativo']}
                  </span>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-700/50 flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                    <ShieldCheck size={14} />
                    Acessar Admin
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 text-gray-300 py-2 rounded-lg text-xs font-semibold transition-colors">
                    <Settings size={14} />
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
