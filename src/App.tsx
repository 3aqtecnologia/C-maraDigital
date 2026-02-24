import { ToastContainer } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  )
}
