import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import type { Database, TenantPlano, TenantSituacao } from '@/types/database'
import type {
  AdminDeletarTenantParams,
  AdminDeletarTenantResult,
  AdminResetarSenhaParams,
  AdminResetarSenhaResult,
  AdminUpdateTenantParams,
} from '@/types/rpc'
import { AlertTriangle, Building2, ExternalLink, KeyRound, MoreVertical, Save, Search, Settings, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Helpers tipados para chamadas RPC (Supabase v2 não gera tipos para RPCs automaticamente)
type RpcFn<P, R> = (fn: string, params: P) => Promise<{ data: R | null; error: Error | null }>

const rpcDeletar = supabase.rpc as unknown as RpcFn<AdminDeletarTenantParams, AdminDeletarTenantResult>
const rpcResetar = supabase.rpc as unknown as RpcFn<AdminResetarSenhaParams, AdminResetarSenhaResult>
const rpcUpdate  = supabase.rpc as unknown as RpcFn<AdminUpdateTenantParams, { success: boolean }>

type TenantOverview = Database['public']['Views']['master_tenant_overview']['Row']

const SITUACAO_LABELS: Record<TenantSituacao, string> = {
  ativo: 'Ativa',
  trial: 'Trial',
  suspenso: 'Suspensa',
  cancelado: 'Cancelada',
}

export function CamarasList() {
  const { impersonateTenant } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()

  const [camaras, setCamaras] = useState<TenantOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState((location.state as { preSearch?: string })?.preSearch || '')

  const [editingCamara, setEditingCamara] = useState<TenantOverview | null>(null)
  const [editForm, setEditForm] = useState<Partial<TenantOverview>>({})
  const [saving, setSaving] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newCredentials, setNewCredentials] = useState<{ admin_email: string, admin_password: string } | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  function openEdit(c: TenantOverview) {
    setEditingCamara(c)
    setEditForm({ ...c })
    setNewCredentials(null)
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  async function handleDeleteTenant() {
    if (!editingCamara) return
    setDeleting(true)
    const { data, error } = await rpcDeletar('admin_deletar_tenant', { p_tenant_id: editingCamara.id! })
    setDeleting(false)
    if (error) {
      showToast('Erro ao remover câmara. Tente novamente.', 'error')
    } else if (data) {
      setCamaras(prev => prev.filter(c => c.id !== editingCamara.id))
      setEditingCamara(null)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
      showToast(`Câmara "${data.nome_tenant}" removida. ${data.usuarios_removidos} usuário(s) removido(s).`, 'success')
    }
  }

  async function handleResetPassword() {
    if (!editingCamara) return
    if (!window.confirm("Essa ação anulará a senha atual do Administrador base desta Câmara e providenciará uma nova provisória. Tem certeza?")) {
      return
    }

    setResettingPassword(true)
    setNewCredentials(null)

    const { data, error } = await rpcResetar('admin_resetar_senha_tenant', { p_tenant_id: editingCamara.id! })

    setResettingPassword(false)

    if (error) {
      showToast('Erro ao resetar senha. Tente novamente.', 'error')
    } else if (data) {
      setNewCredentials({ admin_email: data.email_admin, admin_password: data.nova_senha })
    }
  }

  async function handleSave() {
    if (!editingCamara) return
    setSaving(true)
    const { error } = await rpcUpdate('admin_update_tenant', {
      p_tenant_id: editingCamara.id!,
      p_nome: editForm.nome ?? undefined,
      p_municipio: editForm.municipio ?? undefined,
      p_uf: editForm.uf ?? undefined,
      p_slug: editForm.slug ?? undefined,
      p_plano: editForm.plano ?? undefined,
      p_situacao: editForm.situacao ?? undefined,
    })

    setSaving(false)
    if (error) {
      showToast('Erro ao salvar configurações. Tente novamente.', 'error')
    } else {
      setCamaras(prev => prev.map(c => c.id === editingCamara.id ? { ...c, ...editForm } as TenantOverview : c))
      setEditingCamara(null)
      showToast('Configurações salvas com sucesso.', 'success')
    }
  }

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
                  <span className="text-gray-500">Link de Acesso</span>
                  <a
                    href={`${window.location.protocol}//${camara.slug}.${window.location.host.replace('master.', '').replace('app.', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 font-mono text-xs hover:underline flex items-center gap-1 text-right"
                    title="Acessar portal do cliente em nova aba"
                  >
                    {camara.slug}.{window.location.hostname.replace('master.', '').replace('app.', '')}
                    <ExternalLink size={12} />
                  </a>
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
                  <button
                    onClick={() => impersonateTenant?.(camara.id!)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck size={14} />
                    Acessar Admin
                  </button>
                  <button
                    onClick={() => openEdit(camara)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 text-gray-300 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Settings size={14} />
                    Gerir Câmara
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Gestão da Câmara */}
      {editingCamara && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <div>
                <h3 className="text-lg font-bold text-white">Gestão Mestre: {editingCamara.nome}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {editingCamara.id}</p>
              </div>
              <button onClick={() => setEditingCamara(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-100">

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide border-b border-gray-800 pb-2">Identificação Base</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome da Câmara</label>
                    <input
                      type="text"
                      value={editForm.nome || ''}
                      onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">Município</label>
                      <input
                        type="text"
                        value={editForm.municipio || ''}
                        onChange={e => setEditForm({ ...editForm, municipio: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-gray-400 mb-1">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={editForm.uf || ''}
                        onChange={e => setEditForm({ ...editForm, uf: e.target.value.toUpperCase() })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 text-center uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-gray-400 mb-1">Slug Base (URL de Acesso)</label>
                  <div className="flex border border-gray-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
                    <input
                      type="text"
                      value={editForm.slug || ''}
                      onChange={e => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="w-1/3 min-w-[120px] max-w-[200px] bg-gray-900 border-none px-3 py-2 text-sm text-indigo-400 font-mono text-right focus:ring-0"
                      placeholder="minhacamara"
                    />
                    <div className="flex-1 bg-gray-800 px-3 py-2 text-sm text-gray-500 font-mono border-l border-gray-700 select-none">
                      .{(window.location.hostname).replace('master.', '').replace('app.', '') || 'camaradigital.com.br'}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Isso alterará fisicamente o endereço de todos os usuários desta câmara.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide border-b border-gray-800 pb-2">Plano e Situação (Lifecycle)</h4>

                <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-lg p-4">
                  <p className="text-xs text-indigo-300 mb-3">ATENÇÃO: Alterar a situação do tenant reconfigura permissões e pode bloquear o acesso de centenas de usuários instantaneamente (Ex: Suspenso ou Cancelado corta logins).</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 font-medium">Plano de Assinatura</label>
                      <select
                        value={editForm.plano || 'basico'}
                        onChange={e => setEditForm({ ...editForm, plano: e.target.value as TenantPlano })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 capitalize"
                      >
                        <option value="basico">Básico</option>
                        <option value="profissional">Profissional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 font-medium">Status Operacional</label>
                      <select
                        value={editForm.situacao || 'ativo'}
                        onChange={e => setEditForm({ ...editForm, situacao: e.target.value as TenantSituacao })}
                        className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-1 focus:outline-none capitalize font-semibold ${editForm.situacao === 'cancelado' ? 'border-red-500/50 text-red-400' :
                          editForm.situacao === 'suspenso' ? 'border-orange-500/50 text-orange-400' : 'border-gray-700 focus:ring-indigo-500'
                          }`}
                      >
                        <option value="ativo" className="text-green-400">Ativa (Normal)</option>
                        <option value="trial" className="text-yellow-400">Em Trial</option>
                        <option value="suspenso" className="text-orange-400">Suspensa (Inadimplência, etc)</option>
                        <option value="cancelado" className="text-red-400">Cancelada (Inativa/Desligada)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset de Senha */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide border-b border-gray-800 pb-2 flex items-center gap-2">
                  <KeyRound size={16} />
                  Acesso e Segurança
                </h4>

                <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-white mb-1">Perda de Acesso do Administrador?</p>
                      <p className="text-xs">Se a câmara perdeu total acesso ao sistema, você pode forçar um reset da senha do perfil Administrador e lhe entregar uma provisória.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {resettingPassword ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>Efetuar Hard Reset</>
                      )}
                    </button>
                  </div>

                  {/* Resultados do Reset */}
                  {newCredentials && (
                    <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4 text-left">
                      <p className="text-xs font-semibold uppercase text-green-400 mb-3">
                        Novas Credenciais Geradas
                      </p>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] text-gray-500 block mb-1 uppercase tracking-wider">Conta Principal de Admin</span>
                          <div className="bg-black/50 border border-gray-800 py-2 px-3 rounded text-sm text-gray-200 font-mono select-all">
                            {newCredentials.admin_email}
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 block mb-1 uppercase tracking-wider">Nova Senha Provisória</span>
                          <div className="bg-black/50 border border-gray-800 py-2 px-3 rounded text-sm text-gray-200 font-mono select-all">
                            {newCredentials.admin_password}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Zona de Perigo — Deletar Tenant */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wide border-b border-red-900/40 pb-2 flex items-center gap-2">
                  <Trash2 size={16} />
                  Zona de Perigo
                </h4>

                {!showDeleteConfirm ? (
                  <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <p className="font-semibold text-red-300 text-sm mb-1">Deletar esta câmara permanentemente</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Remove o tenant, todos os usuários, proposições, sessões, leis e demais
                        registros. Esta ação é <span className="text-red-400 font-semibold">irreversível</span> e
                        não pode ser desfeita.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-shrink-0 flex items-center gap-2 bg-red-900/50 hover:bg-red-800/60 border border-red-700/50 text-red-300 hover:text-red-200 font-medium text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      Deletar Câmara
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-950/50 border border-red-700/60 rounded-lg p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 font-semibold text-sm">Confirme a exclusão permanente</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          Todos os dados desta câmara serão destruídos imediatamente. Para confirmar,
                          digite o nome exato da câmara abaixo:
                        </p>
                        <p className="text-xs text-red-300 font-mono mt-2 select-all bg-black/30 px-2 py-1 rounded inline-block">
                          {editingCamara.nome}
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      autoFocus
                      placeholder={`Digite: ${editingCamara.nome}`}
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="w-full bg-black/40 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-200 placeholder-red-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                        className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteTenant}
                        disabled={deleteConfirmText !== editingCamara.nome || deleting}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                      >
                        {deleting ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Trash2 size={14} /> Confirmar Exclusão</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingCamara(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancelar Edição
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save size={16} />
                    Aplicar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
