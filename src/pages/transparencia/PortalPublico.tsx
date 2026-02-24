import { useAuth } from '@/hooks/useAuth'
import { ProposicaoPublica, useFirstActiveTenant, useTenantById, useTenantBySlug, useTransparencia } from '@/hooks/useTransparencia'
import type { Database } from '@/types/database'
import { ArrowLeft, Clock, Download, ExternalLink, FileText, Gavel, LayoutDashboard, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Lei = Database['public']['Tables']['leis']['Row']

export function PortalPublico() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'leis' | 'proposicoes'>('leis')
  const { profile } = useAuth()

  // Múltiplos métodos de detecção de tenant para dar suporte ao modo dev local
  const searchParams = new URLSearchParams(window.location.search)
  const querySlug = searchParams.get('slug')

  const hostname = window.location.hostname
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  // 1. Em produção, usa o subdomínio; Em dev, tenta via ?slug=...
  const slugFromHost = isLocalhost ? querySlug : hostname.split('.')[0]

  const { tenant: tenantBySlug, loading: loadingBySlug } = useTenantBySlug(slugFromHost)

  // 2. Em dev, se não passou slug na query, tenta usar o tenant do profile logado
  const { tenant: tenantById, loading: loadingById } = useTenantById(isLocalhost && !slugFromHost ? (profile?.tenant_id ?? null) : null)

  // 3. Fallback final para dev: pega o primeiro tenant ativo se não estiver logado
  const { tenant: defaultTenant, loading: loadingDefault } = useFirstActiveTenant(isLocalhost && !slugFromHost && !profile?.tenant_id)

  const tenant = tenantBySlug || tenantById || defaultTenant
  const loadingTenant = loadingBySlug && loadingById && loadingDefault
  const { stats, fetchLeis, fetchProposicoes } = useTransparencia(tenant?.id)

  // Aplicar cor primária do tenant como CSS custom property
  useEffect(() => {
    if (tenant?.cor_primaria) {
      document.documentElement.style.setProperty('--tenant-primary', tenant.cor_primaria)
    }
    return () => {
      document.documentElement.style.removeProperty('--tenant-primary')
    }
  }, [tenant?.cor_primaria])

  const [recentLeis, setRecentLeis] = useState<Lei[]>([])
  const [recentProposicoes, setRecentProposicoes] = useState<ProposicaoPublica[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (tenant?.id) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, activeTab])

  async function handleSearch() {
    if (!tenant?.id) return
    setSearching(true)

    if (activeTab === 'leis') {
      const data = await fetchLeis(search)
      setRecentLeis(data)
    } else {
      const data = await fetchProposicoes(search)
      setRecentProposicoes(data)
    }

    setSearching(false)
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const BOM = mimeType.includes('csv') ? '\uFEFF' : ''
    const blob = new Blob([BOM + content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportarCSV() {
    const municipio = tenant?.municipio ?? 'export'
    if (activeTab === 'leis') {
      const headers = ['Número', 'Esfera', 'Ementa', 'Data Publicação', 'Status']
      const rows = recentLeis.map(l => [
        l.numero,
        l.esfera,
        `"${l.ementa.replace(/"/g, '""')}"`,
        new Date(l.data_publicacao).toLocaleDateString('pt-BR'),
        l.status,
      ])
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
      downloadFile(csv, `leis-${municipio}.csv`, 'text/csv;charset=utf-8;')
    } else {
      const headers = ['Número', 'Tipo', 'Ementa', 'Autor', 'Status', 'Protocolo']
      const rows = recentProposicoes.map(p => [
        p.numero,
        p.tipo.replace(/_/g, ' '),
        `"${p.ementa.replace(/"/g, '""')}"`,
        p.autor?.nome ?? '',
        p.status,
        new Date(p.created_at).toLocaleDateString('pt-BR'),
      ])
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
      downloadFile(csv, `proposicoes-${municipio}.csv`, 'text/csv;charset=utf-8;')
    }
  }

  function exportarJSON() {
    const municipio = tenant?.municipio ?? 'export'
    const data = activeTab === 'leis' ? recentLeis : recentProposicoes
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `${activeTab}-${municipio}.json`, 'application/json')
  }

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mb-6">
          <Gavel size={40} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Portal não encontrado</h1>
        <p className="text-gray-500 mt-2 max-w-md">O endereço que você acessou não corresponde a uma Câmara Municipal ativa em nossa plataforma.</p>
        <Link to="/login" className="btn-primary mt-8">Ir para Login</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.nome} className="h-12 w-auto object-contain" />
            ) : (
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                <Gavel size={24} className="text-white" />
              </div>
            )}
            <div>
              <p className="font-extrabold text-xl text-gray-900 leading-none tracking-tight">{tenant.nome}</p>
              <p className="text-gray-500 text-xs mt-1 font-medium">{tenant.municipio} / {tenant.uf} · Portal da Transparência</p>
            </div>
          </div>
          <Link to="/login" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors">
            Acesso Restrito <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-600 pt-16 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-indigo-900 opacity-90" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Transparência a um clique de distância.
          </h1>
          <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
            Acompanhe o trabalho dos seus vereadores, consulte leis municipais e participe da vida política da sua cidade.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="relative max-w-2xl mx-auto group"
          >
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="search"
              placeholder={`Buscar por ${activeTab === 'leis' ? 'número da lei, ementa ou assunto...' : 'número, ementa ou autor...'}`}
              className="w-full pl-14 pr-32 py-5 rounded-2xl bg-white text-gray-900 shadow-2xl shadow-primary-900/20 focus:outline-none focus:ring-4 focus:ring-accent/30 text-lg placeholder:text-gray-400 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
            >
              Consultar
            </button>
          </form>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Proposições', value: stats.proposicoes, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Leis Vigentes', value: stats.leis, icon: Gavel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Sessões Reais', value: stats.sessoes, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Acessos LAI', value: '100%+', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-white flex flex-col items-center text-center transform hover:-translate-y-1 transition-transform cursor-default">
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-3`}>
                <item.icon size={24} />
              </div>
              <p className="text-2xl font-black text-gray-900">{item.value}</p>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Sections */}
      <main className="max-w-6xl mx-auto px-4 py-20">

        {/* Tabs Control */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('leis')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'leis' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Leis Municipais
              {activeTab === 'leis' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('proposicoes')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'proposicoes' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Proposições e Matérias
              {activeTab === 'proposicoes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" />}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">
              {activeTab === 'leis' ? `${recentLeis.length} leis encontradas` : `${recentProposicoes.length} matérias encontradas`}
            </span>
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
              <button
                onClick={exportarCSV}
                title="Exportar CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={exportarJSON}
                title="Exportar JSON"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download size={13} /> JSON
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {searching ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : activeTab === 'leis' ? (
            recentLeis.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                <Gavel size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">Nenhuma lei encontrada com este critério.</p>
              </div>
            ) : (
              recentLeis.map(lei => (
                <Link
                  key={lei.id}
                  to={`/transparencia/lei/${lei.id}`}
                  className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-xl hover:border-primary-100 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black uppercase text-primary-400">Ano</span>
                    <span className="text-sm font-black">{lei.ano}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{lei.esfera} № {lei.numero}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400 font-medium">Publicada em {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">{lei.ementa}</h3>
                  </div>
                  <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100">
                    <button className="flex items-center gap-2 text-primary-600 font-bold text-sm bg-primary-50 px-4 py-2 rounded-xl">
                      Visualizar <ExternalLink size={14} />
                    </button>
                  </div>
                </Link>
              ))
            )
          ) : (
            recentProposicoes.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">Nenhuma proposição encontrada.</p>
              </div>
            ) : (
              recentProposicoes.map(prop => (
                <Link
                  key={prop.id}
                  to={`/transparencia/proposicao/${prop.id}`}
                  className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-xl hover:border-primary-100 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black uppercase text-indigo-400">{prop.ano}</span>
                    <span className="text-sm font-black">#{prop.numero}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge bg-indigo-50 text-indigo-700 text-[10px] font-black py-0.5">{prop.tipo.replace(/_/g, ' ')}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1 font-medium"><User size={12} /> {prop.autor?.nome}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors">{prop.ementa}</h3>
                  </div>
                  <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100">
                    <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl">
                      Acompanhar <ExternalLink size={14} />
                    </button>
                  </div>
                </Link>
              ))
            )
          )}
        </div>

        {/* LAI Section */}
        <section className="mt-32">
          <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-[2.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Shield size={200} />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-primary-900 text-xs font-black uppercase tracking-widest mb-6">
                  <Shield size={14} /> Lei de Acesso à Informação
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Você tem o direito de saber.</h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  O Sistema Eletrônico do Serviço de Informações ao Cidadão (e-SIC) permite que qualquer pessoa, física ou jurídica, encaminhe pedidos de acesso à informação.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-gray-900 font-bold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2">
                    Registrar Solicitação <ExternalLink size={18} />
                  </button>
                  <button className="bg-white/10 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/10">
                    Consultar Pedido
                  </button>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-2xl font-black mb-1">0%</p>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Taxa de Omissão</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-2xl font-black mb-1">~2 dias</p>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tempo de Resposta</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm col-span-2">
                  <p className="text-sm text-gray-300 italic">"A transparência é a regra, o sigilo é a exceção."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                <Gavel size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Portal da Transparência</p>
                <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} {tenant.municipio} / {tenant.uf}</p>
              </div>
            </div>
            <div className="flex gap-10 text-sm font-bold text-gray-400 uppercase tracking-widest">
              <a href="#" className="hover:text-primary-600 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-primary-600 transition-colors">Dados Abertos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Shield({ className, size }: { className?: string, size?: number }) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
