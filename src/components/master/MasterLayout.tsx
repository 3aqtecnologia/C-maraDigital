import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Plus,
  ScrollText,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/master' },
  { label: 'Câmaras', icon: Building2, to: '/master/camaras' },
  { label: 'Provisionar', icon: Plus, to: '/master/provisionar' },
  { label: 'Audit Log', icon: ScrollText, to: '/master/audit' },
  { label: 'Configurações', icon: Settings, to: '/master/configuracoes' },
]

export function MasterLayout() {
  const { masterAdmin, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="flex flex-col w-60 bg-gray-900 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CâmaraDigital</p>
            <p className="text-indigo-400 text-xs font-medium">Master Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/master'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          {masterAdmin && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                {masterAdmin.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{masterAdmin.nome}</p>
                <p className="text-gray-500 text-xs truncate">{masterAdmin.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
