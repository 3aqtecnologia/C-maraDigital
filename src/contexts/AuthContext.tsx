import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { Session, User } from '@supabase/supabase-js'
import { createContext, useEffect, useState } from 'react'

type Profile = Database['public']['Tables']['profiles']['Row']
type MasterAdmin = Database['public']['Tables']['master_admins']['Row']

export type AuthUserType = 'master' | 'tenant' | null

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  masterAdmin: MasterAdmin | null
  userType: AuthUserType
  mustChangePassword: boolean
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  impersonateTenant: (tenantId: string) => void
  stopImpersonating: () => void
}

const initialState: AuthState = {
  session: null,
  user: null,
  profile: null,
  masterAdmin: null,
  userType: null,
  mustChangePassword: false,
  loading: true,
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue>({
  ...initialState,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  impersonateTenant: () => {},
  stopImpersonating: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          mustChangePassword: !!session.user.user_metadata?.force_password_change,
        }))
        resolveUserType(session.user.id)
      } else {
        setState({ ...initialState, loading: false })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          mustChangePassword: !!session.user.user_metadata?.force_password_change,
        }))
        resolveUserType(session.user.id)
      } else {
        setState({ ...initialState, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Descobre se o usuário é Master Admin ou Tenant User.
   * Prioridade: master_admins → profiles
   */
  async function resolveUserType(userId: string) {
    const impersonatedTenantId = sessionStorage.getItem('@camara:impersonate_tenant')

    // 1. Verifica se é master admin
    const { data: masterData } = await supabase
      .from('master_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle()

    if (masterData) {
      if (impersonatedTenantId) {
        // Master Admin atuando como um Admin do Tenant (Impersonation)
        setState(prev => ({
          ...prev,
          masterAdmin: masterData,
          profile: {
            id: masterData.id,
            tenant_id: impersonatedTenantId,
            user_id: masterData.user_id,
            nome: `${masterData.nome} (Admin Mestre)`,
            email: masterData.email,
            cpf: null,
            role: 'admin',
            ativo: true,
            avatar_url: null,
            partido: null,
            matricula: null,
            created_at: masterData.created_at,
            updated_at: masterData.updated_at,
          } as Profile,
          userType: 'tenant', // O sistema entende como tenant
          loading: false,
        }))
        return
      }

      setState(prev => ({
        ...prev,
        masterAdmin: masterData,
        profile: null,
        userType: 'master',
        loading: false,
      }))
      return
    }

    // 2. Verifica perfil de tenant
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle()

    setState(prev => ({
      ...prev,
      profile: profileData ?? null,
      masterAdmin: null,
      userType: profileData ? 'tenant' : null,
      loading: false,
    }))
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    sessionStorage.removeItem('@camara:impersonate_tenant')
    await supabase.auth.signOut()
  }

  function impersonateTenant(tenantId: string) {
    sessionStorage.setItem('@camara:impersonate_tenant', tenantId)
    // Forçamos o reload da página para todos os hooks recompilarem os contextos isolados
    window.location.href = '/backoffice'
  }

  function stopImpersonating() {
    sessionStorage.removeItem('@camara:impersonate_tenant')
    window.location.href = '/master'
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, impersonateTenant, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  )
}

