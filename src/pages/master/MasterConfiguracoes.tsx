import { Bell, Save, Server, Shield } from 'lucide-react'
import { useState } from 'react'

export function MasterConfiguracoes() {
  const [activeTab, setActiveTab] = useState('plataforma')

  const TABS = [
    { id: 'plataforma', label: 'Plataforma Saas', icon: Server },
    { id: 'seguranca', label: 'Segurança e Acesso', icon: Shield },
    { id: 'notificacoes', label: 'Notificações Globais', icon: Bell },
  ]

  return (
    <div className="flex flex-col h-full text-gray-100">
      <div className="px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Configurações Globais</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestão das configurações mestre da infraestrutura SaaS</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${activeTab === tab.id
                    ? 'bg-indigo-600/10 text-indigo-400 font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl space-y-6">

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Server size={20} className="text-indigo-400" />
                Configuração da Plataforma
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">URL Base Padrão</label>
                  <input
                    defaultValue="https://camaradigital.com.br"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sufixo usado na resolução de subdomínios dos tenants.</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5 font-medium">Dias Período Trial Padrão</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                  />
                </div>

                <div className="pt-4 mt-2 border-t border-gray-700 flex justify-end">
                  <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                    <Save size={16} />
                    Salvar Mudanças
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-5 text-center">
              <p className="text-gray-500 text-sm animate-pulse">
                Outras integrações em desenvolvimento...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
