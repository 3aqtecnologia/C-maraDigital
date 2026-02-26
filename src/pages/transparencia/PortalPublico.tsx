import { useAuth } from '@/hooks/useAuth'
import type { ProposicaoPublica } from '@/hooks/useTransparencia'
import {
  useFirstActiveTenant,
  useTenantById,
  useTenantBySlug,
  useTransparencia,
} from '@/hooks/useTransparencia'
import type { Database } from '@/types/database'
import {
  ArrowRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Gavel,
  Mail,
  MapPin,
  Phone,
  Radio,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Lei = Database['public']['Tables']['leis']['Row']
type Sessao = Database['public']['Tables']['sessoes']['Row']

const SESSAO_STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  agendada:    { label: 'Agendada',      color: 'text-blue-700 bg-blue-50',   dot: 'bg-blue-400' },
  em_andamento:{ label: 'Em Andamento',  color: 'text-green-700 bg-green-50', dot: 'bg-green-500 animate-pulse' },
  encerrada:   { label: 'Encerrada',     color: 'text-gray-500 bg-gray-100',  dot: 'bg-gray-400' },
  cancelada:   { label: 'Cancelada',     color: 'text-red-600 bg-red-50',     dot: 'bg-red-400' },
}

export function PortalPublico() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'leis' | 'proposicoes' | 'sessoes'>('leis')
  const [recentLeis, setRecentLeis] = useState<Lei[]>([])
  const [recentProposicoes, setRecentProposicoes] = useState<ProposicaoPublica[]>([])
  const [recentSessoes, setRecentSessoes] = useState<Sessao[]>([])
  const [searching, setSearching] = useState(false)

  const { profile, loading: authLoading } = useAuth()

  // ── Detecção de tenant: subdomínio (prod) ou fallbacks (dev) ──
  const searchParams = new URLSearchParams(window.location.search)
  const querySlug = searchParams.get('slug')
  const hostname = window.location.hostname
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const slugFromHost = isLocalhost ? querySlug : hostname.split('.')[0]

  const { tenant: tenantBySlug, loading: loadingBySlug }    = useTenantBySlug(slugFromHost)
  const { tenant: tenantById,   loading: loadingById }      = useTenantById(
    isLocalhost && !slugFromHost ? (profile?.tenant_id ?? null) : null
  )
  const { tenant: defaultTenant, loading: loadingDefault }  = useFirstActiveTenant(
    isLocalhost && !slugFromHost && !profile?.tenant_id
  )

  const tenant = tenantBySlug || tenantById || defaultTenant

  // Aguarda auth resolver e então espera apenas o hook relevante
  const loadingTenant = authLoading
    ? true
    : slugFromHost
      ? loadingBySlug
      : profile?.tenant_id
        ? loadingById
        : loadingDefault

  const { stats, fetchLeis, fetchProposicoes, fetchSessoes } = useTransparencia(tenant?.id)

  // Aplica cor primária do tenant como CSS custom property
  useEffect(() => {
    if (tenant?.cor_primaria) {
      document.documentElement.style.setProperty('--tenant-primary', tenant.cor_primaria)
    }
    return () => {
      document.documentElement.style.removeProperty('--tenant-primary')
    }
  }, [tenant?.cor_primaria])

  // Carrega dados ao trocar de aba ou ao tenant ser descoberto
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
    } else if (activeTab === 'proposicoes') {
      const data = await fetchProposicoes(search)
      setRecentProposicoes(data)
    } else {
      const data = await fetchSessoes()
      setRecentSessoes(data)
    }
    setSearching(false)
  }

  // ── Exportação de dados ────────────────────────────────────────
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
    let headers: string[]
    let rows: (string | number)[][]

    if (activeTab === 'leis') {
      headers = ['Número', 'Esfera', 'Ementa', 'Data Publicação', 'Status']
      rows = recentLeis.map(l => [
        l.numero, l.esfera,
        `"${l.ementa.replace(/"/g, '""')}"`,
        new Date(l.data_publicacao).toLocaleDateString('pt-BR'),
        l.status,
      ])
    } else if (activeTab === 'proposicoes') {
      headers = ['Número', 'Tipo', 'Ementa', 'Autor', 'Status', 'Protocolo']
      rows = recentProposicoes.map(p => [
        p.numero, p.tipo.replace(/_/g, ' '),
        `"${p.ementa.replace(/"/g, '""')}"`,
        p.autor?.nome ?? '',
        p.status,
        new Date(p.created_at).toLocaleDateString('pt-BR'),
      ])
    } else {
      headers = ['Número', 'Tipo', 'Data', 'Local', 'Status', 'Presentes']
      rows = recentSessoes.map(s => [
        s.numero, s.tipo,
        new Date(s.data_inicio).toLocaleDateString('pt-BR'),
        s.local, s.status, s.presentes.length,
      ])
    }

    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    downloadFile(csv, `${activeTab}-${municipio}.csv`, 'text/csv;charset=utf-8;')
  }

  function exportarJSON() {
    const municipio = tenant?.municipio ?? 'export'
    const data = activeTab === 'leis'
      ? recentLeis
      : activeTab === 'proposicoes'
        ? recentProposicoes
        : recentSessoes
    downloadFile(JSON.stringify(data, null, 2), `${activeTab}-${municipio}.json`, 'application/json')
  }

  const currentCount = activeTab === 'leis'
    ? recentLeis.length
    : activeTab === 'proposicoes'
      ? recentProposicoes.length
      : recentSessoes.length

  // ── Loading ────────────────────────────────────────────────────
  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-xl shadow-primary-200 animate-pulse">
          <Gavel size={26} className="text-white" aria-hidden="true" />
        </div>
        <p className="text-gray-400 text-sm font-medium">Carregando portal...</p>
      </div>
    )
  }

  // ── Tenant não encontrado ──────────────────────────────────────
  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary-100">
          <Gavel size={40} className="text-primary-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Portal não encontrado</h1>
        <p className="text-gray-500 mt-2 max-w-md leading-relaxed">
          O endereço que você acessou não corresponde a uma Câmara Municipal ativa em nossa plataforma.
        </p>
        <Link to="/login" className="btn-primary mt-8">Ir para Login</Link>
      </div>
    )
  }

  const hasContact = !!(tenant.telefone || tenant.email_geral || tenant.endereco || tenant.horario_atendimento)
  const primaryColor = tenant.cor_primaria || '#1e40af'
  const tabLabel = activeTab === 'leis' ? 'lei(s)' : activeTab === 'proposicoes' ? 'matéria(s)' : 'sessão(ões)'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link */}
      <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo principal</a>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo + nome */}
            <div className="flex items-center gap-3 min-w-0">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={`Logotipo ${tenant.nome}`}
                  className="h-10 w-auto object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-200">
                  <Gavel size={20} className="text-white" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-gray-900 leading-none truncate text-sm md:text-base">
                  {tenant.nome}
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5 font-medium hidden sm:block">
                  {tenant.municipio} — {tenant.uf} · Portal da Transparência
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <a
                href="#lai-section"
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <ShieldCheck size={14} aria-hidden="true" /> e-SIC / Ouvidoria
              </a>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Acesso Restrito
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-16 pb-32"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%)` }}
        aria-label="Busca do portal da transparência"
      >
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck size={13} aria-hidden="true" />
            Portal da Transparência Municipal
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            {tenant.municipio}
            <span className="text-white/60"> — {tenant.uf}</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Consulte leis, acompanhe proposições legislativas e sessões plenárias.
            Transparência ativa, democracia participativa.
          </p>

          {/* Barra de busca */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            role="search"
            aria-label="Buscar documentos no portal"
            className="relative max-w-2xl mx-auto"
          >
            <label htmlFor="portal-search" className="sr-only">
              {activeTab === 'leis'
                ? 'Buscar lei por número ou ementa'
                : activeTab === 'proposicoes'
                  ? 'Buscar proposição por número, ementa ou autor'
                  : 'Buscar sessão'}
            </label>
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="portal-search"
              type="search"
              placeholder={
                activeTab === 'leis'
                  ? 'Número da lei, ementa ou assunto...'
                  : activeTab === 'proposicoes'
                    ? 'Número, ementa ou nome do autor...'
                    : 'Tipo ou número da sessão...'
              }
              className="w-full pl-14 pr-32 sm:pr-36 py-4 sm:py-5 rounded-2xl bg-white text-gray-900 shadow-2xl shadow-black/20 focus:outline-none focus:ring-4 focus:ring-white/30 text-base placeholder:text-gray-400 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={activeTab === 'sessoes'}
            />
            <button
              type="submit"
              disabled={activeTab === 'sessoes'}
              className="absolute right-2.5 top-2.5 bottom-2.5 px-5 sm:px-7 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 active:scale-95 transition-all text-sm shadow-lg shadow-primary-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10"
        aria-label="Estatísticas públicas do portal"
      >
        <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl">
          {[
            {
              id: 'proposicoes' as const,
              label: 'Proposições',
              value: stats.proposicoes,
              icon: FileText,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              ring: 'ring-blue-100',
              border: 'border-blue-200',
            },
            {
              id: 'leis' as const,
              label: 'Leis',
              value: stats.leis,
              icon: Gavel,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              ring: 'ring-emerald-100',
              border: 'border-emerald-200',
            },
            {
              id: 'sessoes' as const,
              label: 'Sessões',
              value: stats.sessoes,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              ring: 'ring-amber-100',
              border: 'border-amber-200',
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-pressed={activeTab === item.id}
              className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-gray-200/60 border-2 flex flex-col items-center text-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                activeTab === item.id ? `border-transparent ring-2 ${item.ring}` : 'border-transparent'
              }`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.bg} ${item.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 ring-4 ${item.ring}`}>
                <item.icon size={20} aria-hidden="true" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900">
                {item.value.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-gray-400 mt-1 leading-tight">
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main
        id="conteudo-principal"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
        tabIndex={-1}
      >
        {/* Tabs + controles de exportação */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 mb-8">

          <div role="tablist" aria-label="Categorias do portal" className="flex gap-1">
            {([
              { id: 'leis',        label: 'Leis Municipais',       icon: Gavel    },
              { id: 'proposicoes', label: 'Proposições',            icon: FileText },
              { id: 'sessoes',     label: 'Sessões Plenárias',      icon: Clock    },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 pb-4 px-3 sm:px-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-t whitespace-nowrap ${
                  activeTab === id
                    ? 'text-primary-600'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon size={14} aria-hidden="true" className="hidden sm:block" />
                {label}
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pb-4">
            <span className="text-xs text-gray-400 font-medium hidden sm:block">
              {currentCount} {tabLabel} encontrado(s)
            </span>
            {activeTab !== 'sessoes' && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={exportarCSV}
                  title="Exportar em CSV — compatível com Excel"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Download size={12} aria-hidden="true" /> CSV
                </button>
                <button
                  onClick={exportarJSON}
                  title="Exportar em JSON"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Download size={12} aria-hidden="true" /> JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Panels */}
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {searching ? (
            <div className="py-24 text-center" aria-busy="true" aria-label="Carregando resultados">
              <div
                className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"
                aria-hidden="true"
              />
              <p className="text-gray-400 text-sm mt-3">Buscando dados públicos...</p>
            </div>
          ) : activeTab === 'leis' ? (
            <LeisList leis={recentLeis} />
          ) : activeTab === 'proposicoes' ? (
            <ProposicoesList proposicoes={recentProposicoes} />
          ) : (
            <SessoesList sessoes={recentSessoes} />
          )}
        </div>
      </main>

      {/* ── Seção LAI / e-SIC ───────────────────────────────────── */}
      <section
        id="lai-section"
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 py-20 px-4 sm:px-6"
        aria-labelledby="lai-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-amber-900 text-xs font-black uppercase tracking-widest mb-6">
                <ShieldCheck size={13} aria-hidden="true" />
                Lei de Acesso à Informação — Lei 12.527/2011
              </div>
              <h2
                id="lai-heading"
                className="text-3xl sm:text-4xl font-black text-white mb-5 leading-tight"
              >
                Você tem o direito<br />de saber.
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed max-w-lg">
                O e-SIC permite que qualquer cidadão encaminhe pedidos de acesso a informações
                sobre as atividades da Câmara Municipal. A resposta é obrigatória em até{' '}
                <strong className="text-white">20 dias corridos</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="bg-white text-gray-900 font-bold px-6 py-3.5 rounded-2xl hover:bg-gray-50 transition-all shadow-lg flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Registrar Solicitação <ExternalLink size={15} aria-hidden="true" />
                </Link>
                {tenant.email_geral && (
                  <a
                    href={`mailto:${tenant.email_geral}`}
                    className="bg-white/10 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2 text-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    <Mail size={15} aria-hidden="true" /> Contato por E-mail
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-2xl font-black text-white mb-1">20 dias</p>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider leading-snug">
                  Prazo de Resposta
                </p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-2xl font-black text-white mb-1">0%</p>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider leading-snug">
                  Taxa de Omissão
                </p>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm col-span-2">
                <ShieldCheck size={16} className="text-amber-400 mb-2" aria-hidden="true" />
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  "A transparência é a regra. O sigilo é a exceção."
                  <span className="text-gray-500"> — Lei 12.527/2011</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Informações de contato ──────────────────────────────── */}
      {hasContact && (
        <section
          className="bg-white py-12 px-4 sm:px-6 border-b border-gray-100"
          aria-labelledby="contato-heading"
        >
          <div className="max-w-5xl mx-auto">
            <h2
              id="contato-heading"
              className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6"
            >
              Informações de Contato
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tenant.endereco && (
                <ContactItem icon={MapPin} label="Endereço">
                  <p className="text-sm text-gray-700 leading-snug">{tenant.endereco}</p>
                </ContactItem>
              )}
              {tenant.telefone && (
                <ContactItem icon={Phone} label="Telefone">
                  <a
                    href={`tel:${tenant.telefone}`}
                    className="text-sm text-primary-600 font-medium hover:underline"
                  >
                    {tenant.telefone}
                  </a>
                </ContactItem>
              )}
              {tenant.email_geral && (
                <ContactItem icon={Mail} label="E-mail">
                  <a
                    href={`mailto:${tenant.email_geral}`}
                    className="text-sm text-primary-600 font-medium hover:underline break-all"
                  >
                    {tenant.email_geral}
                  </a>
                </ContactItem>
              )}
              {tenant.horario_atendimento && (
                <ContactItem icon={Clock} label="Horário de Atendimento">
                  <p className="text-sm text-gray-700 leading-snug">{tenant.horario_atendimento}</p>
                </ContactItem>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        className="bg-gray-50 border-t border-gray-200 py-10 px-4 sm:px-6"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <Gavel size={16} className="text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{tenant.nome}</p>
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} · Portal da Transparência Legislativa
              </p>
            </div>
          </div>
          <nav aria-label="Links do rodapé">
            <ul className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-gray-400 uppercase tracking-widest list-none">
              <li><a href="#" className="hover:text-primary-600 transition-colors">Dados Abertos</a></li>
              <li><a href="#" className="hover:text-primary-600 transition-colors">Privacidade</a></li>
              <li>
                <a href="#lai-section" className="hover:text-primary-600 transition-colors">
                  e-SIC / LAI
                </a>
              </li>
              {tenant.site_url && (
                <li>
                  <a
                    href={tenant.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 transition-colors flex items-center gap-1"
                  >
                    Site Oficial <ExternalLink size={10} aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-500" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div
      className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100"
      role="status"
    >
      <Icon size={40} className="mx-auto text-gray-200 mb-3" aria-hidden="true" />
      <p className="text-gray-400 font-medium text-sm">{message}</p>
    </div>
  )
}

function LeisList({ leis }: { leis: Lei[] }) {
  if (leis.length === 0) {
    return <EmptyState icon={Gavel} message="Nenhuma lei encontrada. Tente outros termos de busca." />
  }

  return (
    <ul className="space-y-3" aria-label="Leis municipais">
      {leis.map(lei => (
        <li key={lei.id}>
          <Link
            to={`/transparencia/lei/${lei.id}`}
            className="group bg-white rounded-2xl p-5 md:p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 block"
          >
            <div
              className="w-14 h-14 rounded-2xl bg-emerald-50 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <span className="text-[10px] font-black text-emerald-400 uppercase">Ano</span>
              <span className="text-sm font-black text-emerald-700">{lei.ano}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                  {lei.esfera} Nº {lei.numero}
                </span>
                <span className="text-gray-200" aria-hidden="true">·</span>
                <time
                  dateTime={lei.data_publicacao}
                  className="text-[11px] text-gray-400 font-medium"
                >
                  Publicada em {new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}
                </time>
              </div>
              <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                {lei.ementa}
              </h3>
            </div>
            <div className="md:border-l md:border-gray-100 md:pl-5 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl group-hover:bg-emerald-100 transition-colors">
                Ver lei <ArrowRight size={14} aria-hidden="true" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProposicoesList({ proposicoes }: { proposicoes: ProposicaoPublica[] }) {
  if (proposicoes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        message="Nenhuma proposição encontrada. Tente outros termos de busca."
      />
    )
  }

  return (
    <ul className="space-y-3" aria-label="Proposições e matérias legislativas">
      {proposicoes.map(prop => (
        <li key={prop.id}>
          <Link
            to={`/transparencia/proposicao/${prop.id}`}
            className="group bg-white rounded-2xl p-5 md:p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 block"
          >
            <div
              className="w-14 h-14 rounded-2xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <span className="text-[10px] font-black text-blue-400 uppercase">{prop.ano}</span>
              <span className="text-sm font-black text-blue-700">#{prop.numero}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
                  {prop.tipo.replace(/_/g, ' ')}
                </span>
                {prop.autor?.nome && (
                  <>
                    <span className="text-gray-200" aria-hidden="true">·</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                      <User size={11} aria-hidden="true" /> {prop.autor.nome}
                      {prop.autor.partido && (
                        <span className="text-gray-400">({prop.autor.partido})</span>
                      )}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                {prop.ementa}
              </h3>
            </div>
            <div className="md:border-l md:border-gray-100 md:pl-5 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                Acompanhar <ArrowRight size={14} aria-hidden="true" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SessoesList({ sessoes }: { sessoes: Sessao[] }) {
  if (sessoes.length === 0) {
    return <EmptyState icon={Clock} message="Nenhuma sessão registrada ainda." />
  }

  return (
    <ul className="space-y-3" aria-label="Sessões plenárias">
      {sessoes.map(sessao => {
        const cfg = SESSAO_STATUS_CFG[sessao.status] ?? SESSAO_STATUS_CFG.encerrada
        const dataInicio = new Date(sessao.data_inicio)
        const dia = dataInicio.getDate().toString().padStart(2, '0')
        const mes = dataInicio.toLocaleString('pt-BR', { month: 'short' })
        const hora = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

        return (
          <li
            key={sessao.id}
            className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 flex flex-col md:flex-row md:items-center gap-5"
          >
            {/* Calendário visual */}
            <div
              className="w-14 h-14 rounded-2xl bg-amber-50 flex flex-col items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-xl font-black text-amber-700 leading-none">{dia}</span>
              <span className="text-[10px] font-black text-amber-400 uppercase">{mes}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                  {cfg.label}
                </span>
                <span className="text-gray-200" aria-hidden="true">·</span>
                <span className="text-[11px] text-gray-400 font-medium capitalize">{sessao.tipo}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                {sessao.tipo} Nº {sessao.numero}/{sessao.ano}
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{sessao.local}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={sessao.data_inicio}>{hora}h</time>
                {sessao.presentes.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{sessao.presentes.length} vereador(es) presente(s)</span>
                  </>
                )}
              </p>
            </div>

            {sessao.transmissao_url && (
              <div className="md:border-l md:border-gray-100 md:pl-5 flex-shrink-0">
                <a
                  href={sessao.transmissao_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  aria-label={`Assistir transmissão — ${sessao.tipo} Nº ${sessao.numero}/${sessao.ano}`}
                >
                  <Radio size={13} aria-hidden="true" /> Ao vivo
                </a>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
