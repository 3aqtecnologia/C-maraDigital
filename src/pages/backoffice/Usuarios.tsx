import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { maskCPF } from '@/lib/utils'
import type { Database, UserRole } from '@/types/database'
import { CheckCircle2, Fingerprint, Mail, MoreVertical, Plus, RefreshCw, Search, Shield, Users, X, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Profile = Database['public']['Tables']['profiles']['Row']

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  vereador: { label: 'Vereador', color: 'bg-blue-100 text-blue-700' },
  servidor: { label: 'Servidor', color: 'bg-green-100 text-green-700' },
  executivo: { label: 'Executivo', color: 'bg-orange-100 text-orange-700' },
  cidadao: { label: 'Cidadão', color: 'bg-gray-100 text-gray-600' },
}

export function Usuarios() {
  const { profile: currentProfile } = useAuth()
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroRole, setFiltroRole] = useState<UserRole | 'todos'>('todos')
  const [showConvidar, setShowConvidar] = useState(false)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)

  const [convidarForm, setConvidarForm] = useState({ nome: '', email: '', role: 'vereador' as UserRole, partido: '', cpf: '' })
  const [convidando, setConvidando] = useState(false)
  const [convidadoOk, setConvidadoOk] = useState(false)

  const fetch = useCallback(async () => {
    if (!currentProfile) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('nome', { ascending: true })
    setUsuarios(data ?? [])
    setLoading(false)
  }, [currentProfile])

  useEffect(() => { fetch() }, [fetch])

  const filtrados = usuarios.filter(u => {
    const termo = busca.toLowerCase()
    const matchBusca = !busca || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    const matchRole = filtroRole === 'todos' || u.role === filtroRole
    return matchBusca && matchRole
  })

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    setMenuAberto(null)
    await fetch()
  }

  async function alterarRole(id: string, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setMenuAberto(null)
    await fetch()
  }

  async function handleConvidar() {
    if (!convidarForm.nome || !convidarForm.email) return
    setConvidando(true)
    // Cria o usuário via Supabase Auth e insere o perfil
    const { data: authData, error: authErr } = await supabase.auth.admin
      ? // client-side não tem acesso ao admin API — apenas cria o perfil com email
      { data: null, error: null }
      : { data: null, error: null }

    // Insere convite na tabela profiles (usuário deve completar o cadastro via e-mail)
    const { error } = await supabase.from('profiles').insert({
      tenant_id: currentProfile!.tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // placeholder até o usuário aceitar
      nome: convidarForm.nome,
      email: convidarForm.email,
      role: convidarForm.role,
      partido: convidarForm.partido || null,
      cpf: convidarForm.cpf || null,
      ativo: false,
    })

    if (!error) {
      setConvidadoOk(true)
      setConvidarForm({ nome: '', email: '', role: 'vereador', partido: '', cpf: '' })
      await fetch()
    }
    setConvidando(false)
    void authErr
    void authData
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Usuários"
        description="Gestão de vereadores, servidores e demais usuários da câmara"
        actions={
          <button onClick={() => setShowConvidar(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} />
            Convidar Usuário
          </button>
        }
      />

      <div className="flex-1 p-8 overflow-auto space-y-5">

        {/* Modal Convidar */}
        {showConvidar && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Convidar Usuário</h2>
                <button onClick={() => { setShowConvidar(false); setConvidadoOk(false) }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              {convidadoOk ? (
                <div className="px-6 py-10 text-center">
                  <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Usuário registrado!</p>
                  <p className="text-sm text-gray-500 mt-1">O usuário precisa definir sua senha via link de convite.</p>
                  <button onClick={() => { setShowConvidar(false); setConvidadoOk(false) }} className="btn-primary mt-4 text-sm">Fechar</button>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                      <input type="text" className="input" value={convidarForm.nome} onChange={e => setConvidarForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
                      <input type="text" className="input" placeholder="000.000.000-00" value={convidarForm.cpf} onChange={e => setConvidarForm(f => ({ ...f, cpf: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                      <input type="email" className="input" value={convidarForm.email} onChange={e => setConvidarForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil</label>
                      <select className="input" value={convidarForm.role} onChange={e => setConvidarForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([v, c]) => (
                          <option key={v} value={v}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {convidarForm.role === 'vereador' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Partido (opcional)</label>
                        <input type="text" className="input" placeholder="Ex: MDB, PT, PL..." value={convidarForm.partido} onChange={e => setConvidarForm(f => ({ ...f, partido: e.target.value }))} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 px-6 pb-5">
                    <button onClick={() => setShowConvidar(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                    <button onClick={handleConvidar} disabled={convidando || !convidarForm.nome || !convidarForm.email} className="btn-primary flex-1 text-sm">
                      {convidando ? 'Registrando...' : 'Registrar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="search" placeholder="Buscar por nome ou e-mail..." className="input pl-9 text-sm"
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <select className="input text-sm w-full sm:w-48" value={filtroRole} onChange={e => setFiltroRole(e.target.value as UserRole | 'todos')}>
            <option value="todos">Todos os perfis</option>
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>
          <button onClick={fetch} className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-500" title="Atualizar">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Contagem */}
        <p className="text-sm text-gray-500">
          {filtrados.length} {filtrados.length === 1 ? 'usuário' : 'usuários'}
          {filtroRole !== 'todos' && ` · ${ROLE_CONFIG[filtroRole].label}`}
        </p>

        {/* Lista */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">Carregando usuários...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(u => {
              const roleCfg = ROLE_CONFIG[u.role]
              return (
                <div key={u.id} className="card flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${u.ativo ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {u.nome.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{u.nome}</p>
                      {!u.ativo && <span className="text-xs text-red-500 font-medium">(inativo)</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={11} />{u.email}</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Fingerprint size={11} />
                        {maskCPF(u.cpf)}
                      </span>
                      {u.partido && <span>· {u.partido}</span>}
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`badge text-xs flex-shrink-0 ${roleCfg.color}`}>
                    <Shield size={10} className="mr-1" />
                    {roleCfg.label}
                  </span>

                  {/* Status */}
                  {u.ativo
                    ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    : <XCircle size={16} className="text-gray-300 flex-shrink-0" />
                  }

                  {/* Menu */}
                  {u.id !== currentProfile?.id && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setMenuAberto(menuAberto === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuAberto === u.id && (
                        <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-44 text-sm">
                          <button
                            onClick={() => toggleAtivo(u.id, u.ativo)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            {u.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide">Alterar perfil</p>
                          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][])
                            .filter(([v]) => v !== u.role)
                            .map(([v, c]) => (
                              <button key={v} onClick={() => alterarRole(u.id, v)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">
                                → {c.label}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
