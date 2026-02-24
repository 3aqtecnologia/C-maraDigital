import { useConfiguracoes, type EtapaFluxo, type TipoProposicao, type TipoSessao } from '@/hooks/useConfiguracoes'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Building2, Check, ChevronDown, Edit2, Globe, Image, Mail, MapPin,
  Palette, Phone, Plus, Save, Trash2, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

type Aba = 'identidade' | 'proposicoes' | 'sessoes' | 'fluxo'

// ── Sub-componente: linha editável de Tipo de Proposição ──────────

function LinhaProposicao({ item, onSave, onDelete }: {
  item: TipoProposicao
  onSave: (i: TipoProposicao) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  function confirmar() { onSave(draft); setEditing(false) }

  if (editing) {
    return (
      <tr className="bg-primary-50">
        <td className="px-4 py-2">
          <input className="input text-sm w-16" value={draft.sigla}
            onChange={e => setDraft(d => ({ ...d, sigla: e.target.value.toUpperCase() }))} maxLength={5} />
        </td>
        <td className="px-4 py-2">
          <input className="input text-sm" value={draft.nome}
            onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} />
        </td>
        <td className="px-4 py-2 text-center">
          <input type="checkbox" checked={draft.ativo}
            onChange={e => setDraft(d => ({ ...d, ativo: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Salvar">
              <Check size={16} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancelar">
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-primary-700 text-sm bg-primary-50 px-2 py-0.5 rounded">{item.sigla}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{item.nome}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block w-2 h-2 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={() => { setDraft(item); setEditing(true) }} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded" title="Editar">
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Sub-componente: linha editável de Tipo de Sessão ─────────────

function LinhaSessao({ item, onSave, onDelete }: {
  item: TipoSessao
  onSave: (i: TipoSessao) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  function confirmar() { onSave(draft); setEditing(false) }

  if (editing) {
    return (
      <tr className="bg-primary-50">
        <td className="px-4 py-2">
          <input className="input text-sm" value={draft.nome}
            onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} />
        </td>
        <td className="px-4 py-2">
          <input className="input text-sm" value={draft.descricao ?? ''}
            onChange={e => setDraft(d => ({ ...d, descricao: e.target.value || null }))} />
        </td>
        <td className="px-4 py-2">
          <input type="number" className="input text-sm w-20" min={1} max={100} value={draft.quorum_percentual}
            onChange={e => setDraft(d => ({ ...d, quorum_percentual: Number(e.target.value) }))} />
        </td>
        <td className="px-4 py-2 text-center">
          <input type="checkbox" checked={draft.ativo}
            onChange={e => setDraft(d => ({ ...d, ativo: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.nome}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{item.descricao ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-center">{item.quorum_percentual}%</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block w-2 h-2 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={() => { setDraft(item); setEditing(true) }} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={15} /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
        </div>
      </td>
    </tr>
  )
}

// ── Sub-componente: linha editável de Etapa do Fluxo ─────────────

function LinhaFluxo({ item, todosStatus, onSave, onDelete }: {
  item: EtapaFluxo
  todosStatus: string[]
  onSave: (i: EtapaFluxo) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  function toggleProximo(codigo: string) {
    setDraft(d => ({
      ...d,
      proximos_status: d.proximos_status.includes(codigo)
        ? d.proximos_status.filter(s => s !== codigo)
        : [...d.proximos_status, codigo],
    }))
  }

  function confirmar() { onSave(draft); setEditing(false) }

  if (editing) {
    return (
      <tr className="bg-primary-50">
        <td className="px-4 py-2 text-xs text-gray-500 font-mono">{item.status_codigo}</td>
        <td className="px-4 py-2">
          <input className="input text-sm" value={draft.label}
            onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
        </td>
        <td className="px-4 py-2">
          <input type="color" className="w-9 h-9 rounded border border-gray-300 cursor-pointer" value={draft.cor}
            onChange={e => setDraft(d => ({ ...d, cor: e.target.value }))} />
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap gap-1 max-w-xs">
            {todosStatus.filter(s => s !== item.status_codigo).map(s => (
              <button key={s}
                onClick={() => toggleProximo(s)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${draft.proximos_status.includes(s) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </td>
        <td className="px-4 py-2 text-center">
          <input type="checkbox" checked={draft.ativo}
            onChange={e => setDraft(d => ({ ...d, ativo: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-500">{item.status_codigo}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }} />
          <span className="text-sm font-medium text-gray-900">{item.label}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input type="color" disabled className="w-7 h-7 rounded border border-gray-200 cursor-not-allowed opacity-60" value={item.cor} readOnly />
      </td>
      <td className="px-4 py-3">
        {item.proximos_status.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.proximos_status.map(s => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Status final</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block w-2 h-2 rounded-full ${item.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button onClick={() => { setDraft(item); setEditing(true) }} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={15} /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
        </div>
      </td>
    </tr>
  )
}

// ── Página principal ──────────────────────────────────────────────

export function Configuracoes() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const { tiposProposicao, tiposSessao, fluxoTramitacao, loading,
          salvarTipoProposicao, excluirTipoProposicao,
          salvarTipoSessao, excluirTipoSessao,
          salvarEtapaFluxo, excluirEtapaFluxo,
          uploadLogo } = useConfiguracoes()

  const [aba, setAba] = useState<Aba>('identidade')
  const [saving, setSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nome: '', municipio: '', uf: '', cnpj: '',
    cor_primaria: '#1e3a5f', cor_secundaria: '#f59e0b',
    logo_url: '',
    endereco: '', telefone: '', whatsapp: '',
    email_geral: '', site_url: '', horario_atendimento: '',
  })

  // Novo tipo inline
  const [novoTP, setNovoTP] = useState<{ sigla: string; nome: string } | null>(null)
  const [novoTS, setNovoTS] = useState<{ nome: string; descricao: string; quorum: number } | null>(null)
  const [novoFT, setNovoFT] = useState<{ status_codigo: string; label: string; cor: string } | null>(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()
      .then(({ data }) => {
        if (!data) return
        setForm({
          nome:                data.nome,
          municipio:           data.municipio,
          uf:                  data.uf,
          cnpj:                data.cnpj ?? '',
          cor_primaria:        data.cor_primaria ?? '#1e3a5f',
          cor_secundaria:      (data as { cor_secundaria?: string }).cor_secundaria ?? '#f59e0b',
          logo_url:            data.logo_url ?? '',
          endereco:            (data as { endereco?: string }).endereco ?? '',
          telefone:            (data as { telefone?: string }).telefone ?? '',
          whatsapp:            (data as { whatsapp?: string }).whatsapp ?? '',
          email_geral:         (data as { email_geral?: string }).email_geral ?? '',
          site_url:            (data as { site_url?: string }).site_url ?? '',
          horario_atendimento: (data as { horario_atendimento?: string }).horario_atendimento ?? '',
        })
      })
  }, [profile])

  async function handleSalvarIdentidade() {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('tenants').update({
      nome: form.nome, municipio: form.municipio, uf: form.uf,
      cnpj: form.cnpj || null, logo_url: form.logo_url || null,
      cor_primaria: form.cor_primaria, cor_secundaria: form.cor_secundaria || null,
      endereco: form.endereco || null, telefone: form.telefone || null,
      whatsapp: form.whatsapp || null, email_geral: form.email_geral || null,
      site_url: form.site_url || null, horario_atendimento: form.horario_atendimento || null,
    }).eq('id', profile.tenant_id)
    setSaving(false)
    if (error) { showToast('Erro ao salvar configurações.', 'error') }
    else { showToast('Configurações salvas com sucesso!', 'success') }
  }

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadLogo(file)
    if (url) setForm(f => ({ ...f, logo_url: url }))
  }

  if (loading && aba !== 'identidade') {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Configurações" description="Personalização da câmara" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const ABAS: { id: Aba; label: string }[] = [
    { id: 'identidade',  label: 'Identidade & Contato' },
    { id: 'proposicoes', label: 'Tipos de Proposição' },
    { id: 'sessoes',     label: 'Tipos de Sessão' },
    { id: 'fluxo',       label: 'Fluxo de Tramitação' },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Configurações"
        description="Personalização visual, jurídica e procedimental da câmara"
        actions={
          aba === 'identidade' ? (
            <button onClick={handleSalvarIdentidade} disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm">
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          ) : undefined
        }
      />

      {/* Abas de navegação */}
      <div className="border-b border-gray-200 bg-white px-8">
        <div className="flex gap-1">
          {ABAS.map(a => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                aba === a.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">

        {/* ═══════════════════════════════════════════════
            ABA 1 — IDENTIDADE & CONTATO
        ═══════════════════════════════════════════════ */}
        {aba === 'identidade' && (
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Logo */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Image size={16} className="text-primary-600" />
                <h2 className="font-semibold text-gray-900">Logotipo</h2>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Image size={28} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2 MB.</p>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                  <button onClick={() => logoInputRef.current?.click()}
                    className="btn-secondary text-sm flex items-center gap-2">
                    <Image size={14} /> Trocar logo
                  </button>
                  {form.logo_url && (
                    <button onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                      className="ml-2 text-xs text-red-500 hover:underline">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

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

            {/* Cores */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Palette size={16} className="text-primary-600" />
                <h2 className="font-semibold text-gray-900">Identidade Visual</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Principal</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" value={form.cor_primaria} onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))} />
                    <input type="text" className="input font-mono text-sm" value={form.cor_primaria} onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Cabeçalhos e botões no portal.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" value={form.cor_secundaria} onChange={e => setForm(f => ({ ...f, cor_secundaria: e.target.value }))} />
                    <input type="text" className="input font-mono text-sm" value={form.cor_secundaria} onChange={e => setForm(f => ({ ...f, cor_secundaria: e.target.value }))} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Destaques e badges.</p>
                </div>
              </div>
              {/* Preview */}
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: form.cor_primaria }}>
                    {form.nome.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{form.nome || 'Nome da Câmara'}</p>
                    <p className="text-xs text-gray-400">{form.municipio || 'Município'} · {form.uf || 'UF'}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: form.cor_secundaria }}>
                    Portal
                  </span>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-primary-600" />
                <h2 className="font-semibold text-gray-900">Contato & Endereço</h2>
                <span className="ml-1 text-xs text-gray-400">(exibido no Portal da Transparência)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin size={13} className="inline mr-1" />Endereço completo
                </label>
                <input type="text" className="input" placeholder="Rua das Flores, 123 — Centro" value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone size={13} className="inline mr-1" />Telefone
                  </label>
                  <input type="text" className="input" placeholder="(00) 0000-0000" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone size={13} className="inline mr-1" />WhatsApp
                  </label>
                  <input type="text" className="input" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Mail size={13} className="inline mr-1" />E-mail geral
                  </label>
                  <input type="email" className="input" placeholder="contato@camara.leg.br" value={form.email_geral} onChange={e => setForm(f => ({ ...f, email_geral: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Globe size={13} className="inline mr-1" />Site institucional
                  </label>
                  <input type="url" className="input" placeholder="https://camara.municipio.leg.br" value={form.site_url} onChange={e => setForm(f => ({ ...f, site_url: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de Atendimento</label>
                <input type="text" className="input" placeholder="Seg. a Sex., das 8h às 17h" value={form.horario_atendimento} onChange={e => setForm(f => ({ ...f, horario_atendimento: e.target.value }))} />
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ABA 2 — TIPOS DE PROPOSIÇÃO
        ═══════════════════════════════════════════════ */}
        {aba === 'proposicoes' && (
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Tipos de Proposição</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Defina os tipos de matéria legislativa que sua câmara utiliza.</p>
                </div>
                <button
                  onClick={() => setNovoTP({ sigla: '', nome: '' })}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={14} /> Novo tipo
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50">
                      <th className="px-4 py-3 font-semibold">Sigla</th>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold text-center">Ativo</th>
                      <th className="px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Linha de novo tipo */}
                    {novoTP !== null && (
                      <tr className="bg-green-50 border-t border-green-100">
                        <td className="px-4 py-2">
                          <input autoFocus className="input text-sm w-16" placeholder="PL" value={novoTP.sigla}
                            onChange={e => setNovoTP(v => v ? ({ ...v, sigla: e.target.value.toUpperCase() }) : v)} maxLength={5} />
                        </td>
                        <td className="px-4 py-2">
                          <input className="input text-sm" placeholder="Nome completo do tipo" value={novoTP.nome}
                            onChange={e => setNovoTP(v => v ? ({ ...v, nome: e.target.value }) : v)} />
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">auto</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (novoTP.sigla && novoTP.nome) {
                                  salvarTipoProposicao({ codigo: novoTP.sigla.toLowerCase().replace(/\s+/g, '_'), sigla: novoTP.sigla, nome: novoTP.nome })
                                  setNovoTP(null)
                                }
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
                            <button onClick={() => setNovoTP(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {tiposProposicao.map(item => (
                      <LinhaProposicao key={item.id} item={item}
                        onSave={salvarTipoProposicao}
                        onDelete={excluirTipoProposicao} />
                    ))}
                    {tiposProposicao.length === 0 && novoTP === null && (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum tipo cadastrado. Clique em "Novo tipo" para começar.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ABA 3 — TIPOS DE SESSÃO
        ═══════════════════════════════════════════════ */}
        {aba === 'sessoes' && (
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Tipos de Sessão</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Configure os tipos de sessão do Plenário e seus quóruns.</p>
                </div>
                <button
                  onClick={() => setNovoTS({ nome: '', descricao: '', quorum: 51 })}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={14} /> Novo tipo
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50">
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                      <th className="px-4 py-3 font-semibold text-center">Quórum</th>
                      <th className="px-4 py-3 font-semibold text-center">Ativo</th>
                      <th className="px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novoTS !== null && (
                      <tr className="bg-green-50 border-t border-green-100">
                        <td className="px-4 py-2">
                          <input autoFocus className="input text-sm" placeholder="Nome da sessão" value={novoTS.nome}
                            onChange={e => setNovoTS(v => v ? ({ ...v, nome: e.target.value }) : v)} />
                        </td>
                        <td className="px-4 py-2">
                          <input className="input text-sm" placeholder="Descrição (opcional)" value={novoTS.descricao}
                            onChange={e => setNovoTS(v => v ? ({ ...v, descricao: e.target.value }) : v)} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" className="input text-sm w-20" min={1} max={100} value={novoTS.quorum}
                            onChange={e => setNovoTS(v => v ? ({ ...v, quorum: Number(e.target.value) }) : v)} />
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">auto</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (novoTS.nome) {
                                  salvarTipoSessao({ nome: novoTS.nome, descricao: novoTS.descricao || null, quorum_percentual: novoTS.quorum })
                                  setNovoTS(null)
                                }
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
                            <button onClick={() => setNovoTS(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {tiposSessao.map(item => (
                      <LinhaSessao key={item.id} item={item}
                        onSave={s => salvarTipoSessao(s)}
                        onDelete={excluirTipoSessao} />
                    ))}
                    {tiposSessao.length === 0 && novoTS === null && (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum tipo de sessão cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ABA 4 — FLUXO DE TRAMITAÇÃO
        ═══════════════════════════════════════════════ */}
        {aba === 'fluxo' && (
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Diagrama visual simplificado */}
            {fluxoTramitacao.filter(e => e.ativo).length > 0 && (
              <div className="card bg-gray-50">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Visão geral do fluxo (etapas ativas)</p>
                <div className="flex flex-wrap items-center gap-1">
                  {fluxoTramitacao.filter(e => e.ativo).map((e, idx, arr) => (
                    <span key={e.id} className="flex items-center gap-1">
                      <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: e.cor }}>
                        {e.label}
                      </span>
                      {idx < arr.length - 1 && <ChevronDown size={12} className="text-gray-400 rotate-[-90deg]" />}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Etapas do Fluxo de Tramitação</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Defina os estados e as transições permitidas para proposições.</p>
                </div>
                <button
                  onClick={() => setNovoFT({ status_codigo: '', label: '', cor: '#6b7280' })}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={14} /> Nova etapa
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50">
                      <th className="px-4 py-3 font-semibold">Código</th>
                      <th className="px-4 py-3 font-semibold">Rótulo</th>
                      <th className="px-4 py-3 font-semibold">Cor</th>
                      <th className="px-4 py-3 font-semibold">Próximos status</th>
                      <th className="px-4 py-3 font-semibold text-center">Ativo</th>
                      <th className="px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novoFT !== null && (
                      <tr className="bg-green-50 border-t border-green-100">
                        <td className="px-4 py-2">
                          <input autoFocus className="input text-sm font-mono" placeholder="ex: em_comissao" value={novoFT.status_codigo}
                            onChange={e => setNovoFT(v => v ? ({ ...v, status_codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') }) : v)} />
                        </td>
                        <td className="px-4 py-2">
                          <input className="input text-sm" placeholder="Rótulo visível" value={novoFT.label}
                            onChange={e => setNovoFT(v => v ? ({ ...v, label: e.target.value }) : v)} />
                        </td>
                        <td className="px-4 py-2">
                          <input type="color" className="w-9 h-9 rounded border border-gray-300 cursor-pointer" value={novoFT.cor}
                            onChange={e => setNovoFT(v => v ? ({ ...v, cor: e.target.value }) : v)} />
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-400 italic">Defina após criar</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">auto</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (novoFT.status_codigo && novoFT.label) {
                                  salvarEtapaFluxo({ status_codigo: novoFT.status_codigo, label: novoFT.label, cor: novoFT.cor })
                                  setNovoFT(null)
                                }
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={16} /></button>
                            <button onClick={() => setNovoFT(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {fluxoTramitacao.map(item => (
                      <LinhaFluxo key={item.id} item={item}
                        todosStatus={fluxoTramitacao.map(e => e.status_codigo)}
                        onSave={salvarEtapaFluxo}
                        onDelete={excluirEtapaFluxo} />
                    ))}
                    {fluxoTramitacao.length === 0 && novoFT === null && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Nenhuma etapa configurada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
