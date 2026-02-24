import { useAuth } from '@/hooks/useAuth'
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  Gavel,
  Globe,
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

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
  { label: 'Leis (LeisGov)', icon: BookOpen, to: '/backoffice/leis' },
  { label: 'Documentos (GED)', icon: FolderOpen, to: '/backoffice/documentos' },
  { label: 'Teletrabalho', icon: Clock, to: '/backoffice/teletrabalho' },
  { label: 'Protocolo', icon: ClipboardList, to: '/backoffice/protocolos' },
  { label: 'Ouvidoria e-SIC', icon: MessageSquarePlus, to: '/backoffice/ouvidoria' },
  { label: 'Portal Público', icon: Globe, to: '/transparencia' },
  { label: 'Usuários', icon: Users, to: '/backoffice/usuarios', roles: ['admin'] },
  { label: 'Configurações', icon: Settings, to: '/backoffice/configuracoes', roles: ['admin'] },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { profile, masterAdmin, signOut, stopImpersonating } = useAuth()

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || (profile && item.roles.includes(profile.role))
  )

  return (
    <aside className={`flex flex-col w-64 min-h-screen bg-primary-600 text-white fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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

      {/* Impersonation Banner */}
      {masterAdmin && profile && (
        <div className="mx-3 mt-4 mb-1 p-3 bg-orange-500/10 border border-orange-500/50 rounded-lg animate-pulse">
          <div className="flex items-start gap-2 text-orange-400">
            <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Acesso Mestre</p>
              <p className="text-[10px] opacity-80 mt-1 leading-tight">Você está governando a câmara em modo de suporte.</p>
              <button
                onClick={stopImpersonating}
                className="mt-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded w-full transition-colors"
                title="Voltar ao Painel SaaS"
              >
                Voltar ao Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/backoffice'}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${isActive
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
