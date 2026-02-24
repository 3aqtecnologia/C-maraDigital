import { AuthContext } from '@/contexts/AuthContext'
import { useContext } from 'react'

export type { AuthUserType } from '@/contexts/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
