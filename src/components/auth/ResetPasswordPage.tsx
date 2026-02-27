import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { mustChangePassword, session, loading: authLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Aguarda o Supabase processar o token da URL e inicializar a sessão
  useEffect(() => {
    if (!authLoading) {
      // Como o token da URL ou PKCE leva uns instantes para ser trocado por sessão
      // Podemos ter um pequeno delay
      const timer = setTimeout(() => setIsReady(true), 500)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (!session) {
      setError('Sessão expirada ou inválida. Por favor, solicite a recuperação de senha novamente.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: { force_password_change: false } // Limpa o flag de troca obrigatória
    })

    if (updateError) {
      setError('Erro ao atualizar senha. O link pode ter expirado. ' + updateError.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (authLoading || !isReady) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">CâmaraDigital</h1>
          <p className="text-primary-200 text-sm mt-1">
            {mustChangePassword ? 'Atualização de Senha Obrigatória' : 'Redefinição de Senha'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {mustChangePassword ? 'Defina sua senha definitiva' : 'Criar nova senha'}
          </h2>
          {mustChangePassword && (
            <p className="text-sm text-gray-500 mb-6">
              Por segurança, você precisa alterar sua senha provisória antes de continuar.
            </p>
          )}

          {!session ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <p className="font-semibold text-red-900 mb-1">Ocorreu um erro</p>
                <p>O link de redefinição de senha é inválido ou expirou. Lembre-se que o link só pode ser usado uma vez e no mesmo navegador que foi solicitado.</p>
              </div>
              <Link to="/forgot-password" className="btn-primary w-full justify-center flex py-2.5">
                Solicitar novo link
              </Link>
              <div className="text-center pt-2">
                <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Voltar para o Login
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-semibold text-green-900 mb-1">Senha atualizada com sucesso!</p>
                <p>Sua senha foi redefinida. Agora você já pode acessar todos os recursos da plataforma.</p>
              </div>
              <button
                onClick={() => navigate(mustChangePassword ? '/backoffice' : '/login', { replace: true })}
                className="btn-primary w-full justify-center flex py-2.5"
              >
                {mustChangePassword ? 'Ir para o Painel' : 'Acessar a Plataforma'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nova Senha
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center flex items-center gap-2 py-2.5"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>

              {!mustChangePassword && (
                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    Cancelar e voltar
                  </Link>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
