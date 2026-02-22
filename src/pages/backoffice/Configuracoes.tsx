import { useState, useEffect } from 'react'
import { Settings, Save, Globe, Building2, Palette, CheckCircle2, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function Configuracoes() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    municipio: '',
    uf: '',
    cnpj: '',
    cor_primaria: '#1e3a5f',
  })

  useEffect(() => {
    if (!profile) return
    supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome,
            municipio: data.municipio,
            uf: data.uf,
            cnpj: data.cnpj ?? '',
            cor_primaria: data.cor_primaria ?? '#1e3a5f',
          })
        }
        setLoading(false)
      })
  }, [profile])

  async function handleSalvar() {
    if (!profile) return
    setSaving(true)
    setSuccess(false)
    setError(null)

    const { error: err } = await supabase
      .from('tenants')
      .update({
        nome:         form.nome,
        municipio:    form.municipio,
        uf:           form.uf,
        cnpj:         form.cnpj || null,
        cor_primaria: form.cor_primaria,
      })
      .eq('id', profile.tenant_id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Configurações" description="Dados e preferências da câmara" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Configurações"
        description="Dados e preferências da câmara"
        actions={
          <button
            onClick={handleSalvar}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {success ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Salvando...' : success ? 'Salvo!' : 'Salvar alterações'}
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Dados institucionais */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Dados Institucionais</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Câmara</label>
              <input type="text" className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Município</label>
                <input type="text" className="input" value={form.municipio} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
                <select className="input" value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))}>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
              <input type="text" className="input" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
            </div>
          </div>

          {/* Personalização */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Palette size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Personalização</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Principal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  value={form.cor_primaria}
                  onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))}
                />
                <input type="text" className="input font-mono text-sm" value={form.cor_primaria}
                  onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Esta cor será usada no Portal da Transparência público.</p>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: form.cor_primaria }}>
                  <Settings size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{form.nome || 'Nome da Câmara'}</p>
                  <p className="text-xs text-gray-400">{form.municipio || 'Município'} · {form.uf || 'UF'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Portal público */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Portal da Transparência</h2>
            </div>
            <p className="text-sm text-gray-500">
              O Portal da Transparência está disponível em{' '}
              <a href="/transparencia" target="_blank" className="text-primary-600 hover:underline font-medium">
                /transparencia
              </a>
              {' '}e publica automaticamente proposições aprovadas, leis e sessões encerradas.
            </p>
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 size={14} />
              Portal ativo e publicando dados automaticamente
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
