import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type MasterAdmin = Database['public']['Tables']['master_admins']['Row']

export type AuthUserType = 'master' | 'tenant' | null

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  masterAdmin: MasterAdmin | null
  userType: AuthUserType
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    masterAdmin: null,
    userType: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session, user: session.user }))
        resolveUserType(session.user.id)
      } else {
        setState(prev => ({ ...prev, session: null, user: null, loading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session, user: session.user }))
        resolveUserType(session.user.id)
      } else {
        setState({
          session: null,
          user: null,
          profile: null,
          masterAdmin: null,
          userType: null,
          loading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Descobre se o usuário é Master Admin ou Tenant User.
   * Prioridade: master_admins → profiles
   */
  async function resolveUserType(userId: string) {
    // 1. Verifica se é master admin
    const { data: masterData } = await supabase
      .from('master_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle()

    if (masterData) {
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
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}
