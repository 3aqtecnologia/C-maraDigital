import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PageLoader } from '@/components/ui/PageLoader'
import { Menu } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile com hamburger */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de navegação"
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} className="text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800 text-sm">CâmaraDigital</span>
        </div>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
