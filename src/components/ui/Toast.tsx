import { ToastContext } from '@/contexts/ToastContext'
import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { useContext } from 'react'
import { createPortal } from 'react-dom'

const ICONS = {
  success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
}

const BG = {
  success: 'border-green-100 bg-green-50',
  error: 'border-red-100 bg-red-50',
  info: 'border-blue-100 bg-blue-50',
}

export function ToastContainer() {
  const { toasts, dismissToast } = useContext(ToastContext)

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          aria-live="polite"
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm text-gray-800 ${BG[toast.type]}`}
        >
          {ICONS[toast.type]}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar notificação"
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
