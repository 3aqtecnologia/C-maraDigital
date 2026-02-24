import { ToastContext } from '@/contexts/ToastContext'
import { useContext } from 'react'

export function useToast() {
  return useContext(ToastContext)
}
