import { ToastContainer } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { supabaseConfigured } from '@/lib/supabase'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-600 px-8 py-6 text-white">
            <h1 className="text-xl font-bold">Configuração incompleta</h1>
            <p className="text-red-100 text-sm mt-1">CâmaraDigital não pode inicializar</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              As variáveis de ambiente do Supabase não foram encontradas.
              Configure as seguintes variáveis no painel da Vercel:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs space-y-2 border border-gray-200">
              <p className="text-gray-800">VITE_SUPABASE_URL=<span className="text-red-500">sua-url-aqui</span></p>
              <p className="text-gray-800">VITE_SUPABASE_ANON_KEY=<span className="text-red-500">sua-chave-aqui</span></p>
            </div>
            <p className="text-gray-400 text-xs">
              Acesse <strong>Vercel → Project → Settings → Environment Variables</strong>,
              adicione as variáveis e faça um novo deploy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  )
}
