import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <MapPinOff className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Página não encontrada</h2>
        <p className="text-sm text-gray-500 mb-8">
          O endereço que você acessou não existe ou foi movido. Verifique a URL ou navegue de volta ao início.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/backoffice"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Voltar ao início
          </Link>
          <Link
            to="/transparencia"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Portal da Transparência
          </Link>
        </div>
      </div>
    </div>
  )
}
