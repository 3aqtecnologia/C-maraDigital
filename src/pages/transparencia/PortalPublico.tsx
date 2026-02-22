import { Search, FileText, Gavel, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export function PortalPublico() {
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Gavel size={20} className="text-primary-900" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Portal da Transparência</p>
              <p className="text-primary-300 text-xs">Câmara Municipal</p>
            </div>
          </div>
          <a href="/login" className="text-sm text-primary-200 hover:text-white transition-colors">
            Acesso restrito →
          </a>
        </div>
      </header>

      {/* Hero search */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-700 text-white pb-12 pt-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Portal da Transparência Legislativa</h1>
          <p className="text-primary-200 mb-6">
            Consulte proposições, votações, leis e documentos públicos da Câmara Municipal
          </p>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar proposições, leis, documentos..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Proposições', icon: FileText, count: '127' },
            { label: 'Leis Aprovadas', icon: Gavel, count: '47' },
            { label: 'Sessões', icon: Gavel, count: '12' },
            { label: 'Documentos', icon: Download, count: '89' },
          ].map(item => (
            <button
              key={item.label}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
            >
              <item.icon size={24} className="text-primary-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">{item.count}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Recent laws */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Leis Recentes</h2>
            <button className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todas <ExternalLink size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { num: 'Lei nº 2.847/2025', ementa: 'Institui o programa municipal de incentivo ao esporte escolar', data: '20/01/2025' },
              { num: 'Lei nº 2.846/2025', ementa: 'Dispõe sobre o uso de câmeras de segurança em logradouros públicos', data: '15/01/2025' },
              { num: 'Lei nº 2.845/2024', ementa: 'Cria o fundo municipal de habitação de interesse social', data: '20/12/2024' },
            ].map(lei => (
              <div key={lei.num} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{lei.num}</p>
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{lei.ementa}</p>
                  <p className="text-gray-400 text-xs mt-1">{lei.data}</p>
                </div>
                <button className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium flex-shrink-0">
                  <Download size={14} />
                  PDF
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LAI / e-SIC */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
          <h2 className="font-bold text-primary-900 mb-1">Acesso à Informação (LAI / e-SIC)</h2>
          <p className="text-primary-700 text-sm mb-4">
            Solicite informações públicas conforme a Lei nº 12.527/2011
          </p>
          <button className="btn-primary text-sm">
            Registrar solicitação
          </button>
        </div>
      </div>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-200">
        © {new Date().getFullYear()} · Portal da Transparência · Desenvolvido com CâmaraDigital
      </footer>
    </div>
  )
}
