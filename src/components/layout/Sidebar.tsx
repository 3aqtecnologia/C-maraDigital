import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Gavel,
  FolderOpen,
  Globe,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/backoffice' },
  { label: 'Legislativo', icon: FileText, to: '/backoffice/legislativo' },
  { label: 'Plenário', icon: Gavel, to: '/backoffice/plenario' },
  { label: 'Documentos (GED)', icon: FolderOpen, to: '/backoffice/documentos' },
  { label: 'Portal Público', icon: Globe, to: '/transparencia' },
  { label: 'Usuários', icon: Users, to: '/backoffice/usuarios', roles: ['admin'] },
  { label: 'Configurações', icon: Settings, to: '/backoffice/configuracoes', roles: ['admin'] },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || (profile && item.roles.includes(profile.role))
  )

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-primary-600 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-500">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Gavel size={16} className="text-primary-900" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">CâmaraDigital</p>
          {profile && (
            <p className="text-primary-300 text-xs truncate">{profile.nome.split(' ')[0]}</p>
          )}
        </div>
      </div>

      {/* Tenant info */}
      {profile && (
        <div className="px-6 py-3 bg-primary-700 text-xs text-primary-300 border-b border-primary-500">
          <span className="uppercase font-medium tracking-wide">Câmara Municipal</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/backoffice'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-white text-primary-600'
                  : 'text-primary-100 hover:bg-primary-500 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-primary-600' : ''} />
                <span className="flex-1">{item.label}</span>
                <ChevronRight
                  size={14}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-primary-400' : ''}`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile footer */}
      <div className="px-3 py-4 border-t border-primary-500">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2">
            <div className="w-8 h-8 rounded-full bg-accent text-primary-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {profile.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{profile.nome}</p>
              <p className="text-xs text-primary-300 capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-primary-200 hover:bg-primary-500 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
