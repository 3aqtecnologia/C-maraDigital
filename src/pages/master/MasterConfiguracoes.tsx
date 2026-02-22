import { Bell, CreditCard, Plus, Save, Server, Shield, X } from 'lucide-react'
import { useState } from 'react'

type PlanoDef = {
  id: string
  nome: string
  maxUsuarios: number
  storage: number
  precoBase: number | 'Sob consulta'
  ilimitado: boolean
}

export function MasterConfiguracoes() {
  const [activeTab, setActiveTab] = useState('plataforma')

  const [planos, setPlanos] = useState<PlanoDef[]>([
    { id: 'basico', nome: 'Plano Básico', maxUsuarios: 15, storage: 5, precoBase: 490, ilimitado: false },
    { id: 'profissional', nome: 'Plano Profissional', maxUsuarios: 30, storage: 20, precoBase: 890, ilimitado: false },
    { id: 'enterprise', nome: 'Plano Enterprise', maxUsuarios: 999, storage: 100, precoBase: 'Sob consulta', ilimitado: true },
  ])
  const [showNovoPlano, setShowNovoPlano] = useState(false)
  const [novoPlano, setNovoPlano] = useState<Partial<PlanoDef>>({
    nome: '', maxUsuarios: 10, storage: 5, precoBase: 100, ilimitado: false
  })

  function handleAddPlano() {
    if (!novoPlano.nome) return
    const id = novoPlano.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')
    setPlanos([...planos, {
      id,
      nome: novoPlano.nome,
      maxUsuarios: Number(novoPlano.maxUsuarios),
      storage: Number(novoPlano.storage),
      precoBase: novoPlano.ilimitado ? 'Sob consulta' : Number(novoPlano.precoBase),
      ilimitado: Boolean(novoPlano.ilimitado)
    }])
    setShowNovoPlano(false)
    setNovoPlano({ nome: '', maxUsuarios: 10, storage: 5, precoBase: 100, ilimitado: false })
  }

  const TABS = [
    { id: 'plataforma', label: 'Plataforma Saas', icon: Server },
    { id: 'planos', label: 'Planos e Limites', icon: CreditCard },
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

            {activeTab === 'plataforma' && (
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
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">Dias Período de Teste (Trial) Padrão</label>
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
            )}

            {activeTab === 'planos' && (
              <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-indigo-400" />
                    Limites por Planos de Assinatura
                  </h2>

                  <div className="space-y-6">
                    {/* Lista Dinâmica de Planos */}
                    {planos.map((plano) => (
                      <div key={plano.id} className="bg-gray-900 border border-gray-700 rounded-lg p-5 relative overflow-hidden group">
                        {plano.ilimitado && (
                          <div className="absolute top-0 right-0 p-3">
                            <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2 py-1 rounded font-semibold">Ilimitado</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-white">{plano.nome}</h3>
                          <button
                            onClick={() => setPlanos(planos.filter(p => p.id !== plano.id))}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover Plano"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Máx. Usuários</label>
                            <input
                              type="number"
                              defaultValue={plano.maxUsuarios}
                              disabled={plano.ilimitado}
                              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 ${plano.ilimitado ? 'text-gray-500 cursor-not-allowed' : 'text-gray-100'}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Limite de Armazenamento (GB)</label>
                            <input
                              type="number"
                              defaultValue={plano.storage}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Preço Base (R$)</label>
                            <input
                              type="text"
                              defaultValue={plano.precoBase}
                              disabled={plano.ilimitado}
                              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 ${plano.ilimitado ? 'text-gray-500 cursor-not-allowed italic' : 'text-gray-100'}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Botão e Formulário de Novo Plano */}
                    {!showNovoPlano ? (
                      <button
                        onClick={() => setShowNovoPlano(true)}
                        className="w-full py-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-indigo-500 hover:bg-gray-800/50 flex items-center justify-center gap-2 text-gray-400 hover:text-indigo-400 transition-all"
                      >
                        <Plus size={18} />
                        Criar Novo Plano de Assinatura
                      </button>
                    ) : (
                      <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-lg p-5">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-indigo-300">Novo Plano</h3>
                          <button onClick={() => setShowNovoPlano(false)} className="text-gray-400 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-indigo-300/80 mb-1">Nome do Plano</label>
                            <input
                              type="text"
                              value={novoPlano.nome}
                              onChange={e => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                              placeholder="Ex: Essencial"
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-indigo-300/80 mb-1">Máx. Usuários</label>
                            <input
                              type="number"
                              value={novoPlano.maxUsuarios}
                              onChange={e => setNovoPlano({ ...novoPlano, maxUsuarios: Number(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-indigo-300/80 mb-1">Armazenamento (GB)</label>
                            <input
                              type="number"
                              value={novoPlano.storage}
                              onChange={e => setNovoPlano({ ...novoPlano, storage: Number(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-indigo-300/80 mb-1">Preço Base (R$)</label>
                            <input
                              type="number"
                              value={novoPlano.precoBase}
                              onChange={e => setNovoPlano({ ...novoPlano, precoBase: Number(e.target.value) })}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="ilimitado"
                            checked={novoPlano.ilimitado}
                            onChange={e => setNovoPlano({ ...novoPlano, ilimitado: e.target.checked })}
                            className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500 bg-gray-900"
                          />
                          <label htmlFor="ilimitado" className="text-sm text-gray-300">Marcar como plano Ilimitado (ex: Enterprise)</label>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700/50">
                          <button onClick={() => setShowNovoPlano(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
                          <button onClick={handleAddPlano} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm">Configurar Plano</button>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                      <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                        <Save size={16} />
                        Salvar Limites
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-400" />
                  Segurança, Acesso e Compliance
                </h2>

                <div className="space-y-6">
                  {/* Tempo de Sessão Ociosa */}
                  <div>
                    <label className="block text-sm text-gray-300 font-medium mb-1.5">Expiração de Sessão por Inatividade (minutos)</label>
                    <input
                      type="number"
                      defaultValue={120}
                      className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tempo até deslogar o usuário automaticamente após inatividade nos painéis.</p>
                  </div>

                  <div className="border-t border-gray-700/50 pt-5 space-y-4">
                    <h3 className="text-md font-medium text-gray-200">Políticas de Acesso Mestre</h3>

                    {/* MFA Switch */}
                    <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Forçar MFA (Multi-factor Auth)</p>
                        <p className="text-xs text-gray-400 mt-0.5">Exigir autenticação em 2 fatores para todas as contas <code className="text-indigo-400 px-1 py-0.5 bg-indigo-900/30 rounded">Master Admin</code></p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* IPs Permitidos */}
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-white">Endereços IP Permitidos (Whitelist)</p>
                        <p className="text-xs text-gray-400 mt-0.5">Insira a lista de endereços IP permitidos para acesso ao painel Mestre (separados por vírgula).</p>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Ex: 192.168.1.10, 10.0.0.5"
                        defaultValue=""
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-700 flex justify-end">
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                      <Save size={16} />
                      Salvar Regras de Segurança
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-12 flex flex-col items-center justify-center text-center">
                <Bell size={32} className="text-gray-600 mb-3" />
                <h3 className="text-lg font-medium text-gray-300">Em desenvolvimento</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">
                  O painel de configuração e SMTP/Envio de e-mails em lote globais entrarão na próxima fase.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
