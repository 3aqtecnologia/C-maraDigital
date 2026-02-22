import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TenantPlano } from '@/types/database'

const PLANOS: { value: TenantPlano; label: string; desc: string; max: number; preco: string }[] = [
  { value: 'basico',       label: 'Básico',       desc: 'Até 15 usuários, 5 GB storage',  max: 15,  preco: 'R$ 490/mês' },
  { value: 'profissional', label: 'Profissional', desc: 'Até 30 usuários, 20 GB storage', max: 30,  preco: 'R$ 890/mês' },
  { value: 'enterprise',   label: 'Enterprise',   desc: 'Usuários ilimitados, 100 GB',    max: 999, preco: 'Sob consulta' },
]

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

type FormState = {
  nome: string
  municipio: string
  uf: string
  cnpj: string
  slug: string
  plano: TenantPlano
}

export function ProvisionarCamara() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    nome: '', municipio: '', uf: 'SP', cnpj: '', slug: '', plano: 'basico',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [newTenantId, setNewTenantId] = useState<string | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function generateSlug(_nome: string, municipio: string, uf: string) {
    const text = `camara-${municipio}-${uf}`
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleNomeChange(nome: string) {
    set('nome', nome)
    if (!form.slug || form.slug === generateSlug(form.nome, form.municipio, form.uf)) {
      set('slug', generateSlug(nome, form.municipio, form.uf))
    }
  }

  function handleMunicipioChange(municipio: string) {
    set('municipio', municipio)
    set('slug', generateSlug(form.nome, municipio, form.uf))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('provisionar_tenant', {
      p_nome:         form.nome,
      p_municipio:    form.municipio,
      p_uf:           form.uf,
      p_cnpj:         form.cnpj.replace(/\D/g, ''),
      p_slug:         form.slug,
      p_plano:        form.plano,
      p_max_usuarios: PLANOS.find(p => p.value === form.plano)?.max ?? 15,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setNewTenantId(data as string)
    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col h-full text-gray-100">
        <div className="px-8 py-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Câmara Provisionada</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{form.nome}</h2>
            <p className="text-gray-400 text-sm mb-1">{form.municipio}/{form.uf}</p>
            <p className="text-gray-500 text-xs font-mono mb-6">{newTenantId}</p>
            <p className="text-gray-300 text-sm mb-8">
              A câmara foi provisionada com sucesso. O próximo passo é criar o usuário administrador desta câmara.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/master/camaras')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Ver todas as câmaras
              </button>
              <button
                onClick={() => { setStatus('idle'); setForm({ nome:'', municipio:'', uf:'SP', cnpj:'', slug:'', plano:'basico' }) }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Provisionar outra
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full text-gray-100">
      <div className="px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Provisionar Nova Câmara</h1>
        <p className="text-gray-400 text-sm mt-0.5">Cria um novo tenant isolado na plataforma SaaS</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

          {/* Identificação */}
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-gray-200 font-semibold flex items-center gap-2">
              <Building2 size={17} className="text-indigo-400" />
              Identificação da Câmara
            </h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nome da Câmara *</label>
              <input
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-600"
                placeholder="Ex: Câmara Municipal de Campinas"
                value={form.nome}
                onChange={e => handleNomeChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Município *</label>
                <input
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-600"
                  placeholder="Campinas"
                  value={form.municipio}
                  onChange={e => handleMunicipioChange(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">UF *</label>
                <select
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.uf}
                  onChange={e => { set('uf', e.target.value); set('slug', generateSlug(form.nome, form.municipio, e.target.value)) }}
                >
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">CNPJ</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-600"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={e => set('cnpj', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Slug (URL) *</label>
                <input
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-600"
                  placeholder="camara-municipio-sp"
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Plano */}
          <section className="space-y-3">
            <h2 className="text-gray-200 font-semibold">Plano de Assinatura</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANOS.map(plano => (
                <button
                  key={plano.value}
                  type="button"
                  onClick={() => set('plano', plano.value)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    form.plano === plano.value
                      ? 'border-indigo-500 bg-indigo-600/10 ring-1 ring-indigo-500'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className="text-white font-semibold text-sm">{plano.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{plano.desc}</p>
                  <p className="text-indigo-400 font-medium text-sm mt-2">{plano.preco}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Erro */}
          {status === 'error' && (
            <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-xl px-5 py-4 text-red-300">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold text-sm">Erro ao provisionar</p>
                <p className="text-xs mt-0.5 text-red-400">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Provisionando...
                </>
              ) : (
                <>
                  <Building2 size={16} />
                  Provisionar Câmara
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/master')}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
