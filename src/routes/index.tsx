import { PageLoader } from '@/components/ui/PageLoader'
import { NotFound } from '@/pages/NotFound'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { MasterGuard } from './MasterGuard'

// Helper: transforma named exports em default exports para React.lazy
function lazy$<T extends Record<string, React.ComponentType>>(
  load: () => Promise<T>,
  name: keyof T
) {
  return lazy(() => load().then(m => ({ default: m[name] as React.ComponentType })))
}

// ── Auth pages (eager — usadas antes da autenticação) ────────────
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage'
import { LoginPage } from '@/components/auth/LoginPage'
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage'

// ── Layouts (eager — são shells, não têm código pesado) ──────────
import { AppLayout } from '@/components/layout/AppLayout'
import { MasterLayout } from '@/components/master/MasterLayout'

// ── Backoffice pages (lazy) ──────────────────────────────────────
const Dashboard        = lazy$(() => import('@/pages/backoffice/Dashboard'),        'Dashboard')
const Legislativo      = lazy$(() => import('@/pages/backoffice/Legislativo'),      'Legislativo')
const ProposicaoNova   = lazy$(() => import('@/pages/backoffice/ProposicaoNova'),   'ProposicaoNova')
const ProposicaoDetalhe = lazy$(() => import('@/pages/backoffice/ProposicaoDetalhe'), 'ProposicaoDetalhe')
const LeisList         = lazy$(() => import('@/pages/backoffice/LeisList'),         'LeisList')
const LeiNova          = lazy$(() => import('@/pages/backoffice/LeiNova'),          'LeiNova')
const LeiDetalhe       = lazy$(() => import('@/pages/backoffice/LeiDetalhe'),       'LeiDetalhe')
const Plenario         = lazy$(() => import('@/pages/backoffice/Plenario'),         'Plenario')
const PlenarioAtivo    = lazy$(() => import('@/pages/backoffice/PlenarioAtivo'),    'PlenarioAtivo')
const PlenarioGerenciar = lazy$(() => import('@/pages/backoffice/PlenarioGerenciar'), 'PlenarioGerenciar')
const Documentos       = lazy$(() => import('@/pages/backoffice/Documentos'),       'Documentos')
const Teletrabalho     = lazy$(() => import('@/pages/backoffice/Teletrabalho'),     'Teletrabalho')
const Ouvidoria        = lazy$(() => import('@/pages/backoffice/Ouvidoria'),        'Ouvidoria')
const Protocolos       = lazy$(() => import('@/pages/backoffice/Protocolos'),       'Protocolos')
const Usuarios         = lazy$(() => import('@/pages/backoffice/Usuarios'),         'Usuarios')
const Configuracoes    = lazy$(() => import('@/pages/backoffice/Configuracoes'),    'Configuracoes')

// ── Master pages (lazy) ──────────────────────────────────────────
const MasterDashboard     = lazy$(() => import('@/pages/master/MasterDashboard'),     'MasterDashboard')
const CamarasList         = lazy$(() => import('@/pages/master/CamarasList'),         'CamarasList')
const ProvisionarCamara   = lazy$(() => import('@/pages/master/ProvisionarCamara'),   'ProvisionarCamara')
const AuditLog            = lazy$(() => import('@/pages/master/AuditLog'),            'AuditLog')
const MasterConfiguracoes = lazy$(() => import('@/pages/master/MasterConfiguracoes'), 'MasterConfiguracoes')

// ── Public (transparência) pages (lazy) ─────────────────────────
const PortalPublico            = lazy$(() => import('@/pages/transparencia/PortalPublico'),            'PortalPublico')
const ProposicaoPublicaDetalhe = lazy$(() => import('@/pages/transparencia/ProposicaoPublicaDetalhe'), 'ProposicaoPublicaDetalhe')
const LeiPublicaDetalhe        = lazy$(() => import('@/pages/transparencia/LeiPublicaDetalhe'),        'LeiPublicaDetalhe')
const Verificador              = lazy$(() => import('@/pages/transparencia/Verificador'),              'Verificador')

const loader = <PageLoader />

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/backoffice" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/transparencia',
    element: <Suspense fallback={loader}><PortalPublico /></Suspense>,
  },
  {
    path: '/transparencia/proposicao/:id',
    element: <Suspense fallback={loader}><ProposicaoPublicaDetalhe /></Suspense>,
  },
  {
    path: '/transparencia/lei/:id',
    element: <Suspense fallback={loader}><LeiPublicaDetalhe /></Suspense>,
  },
  {
    path: '/verificar/:hash',
    element: <Suspense fallback={loader}><Verificador /></Suspense>,
  },

  // ── Master Admin ────────────────────────────────────────────
  {
    path: '/master',
    element: (
      <MasterGuard>
        <MasterLayout />
      </MasterGuard>
    ),
    children: [
      { index: true, element: <MasterDashboard /> },
      { path: 'camaras', element: <CamarasList /> },
      { path: 'provisionar', element: <ProvisionarCamara /> },
      { path: 'audit', element: <AuditLog /> },
      { path: 'configuracoes', element: <MasterConfiguracoes /> },
    ],
  },

  // ── Backoffice (tenant) ─────────────────────────────────────
  {
    path: '/backoffice',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'legislativo', element: <Legislativo /> },
      { path: 'legislativo/nova', element: <ProposicaoNova /> },
      { path: 'legislativo/:id', element: <ProposicaoDetalhe /> },
      { path: 'leis', element: <LeisList /> },
      { path: 'leis/nova', element: <LeiNova /> },
      { path: 'leis/:id', element: <LeiDetalhe /> },
      { path: 'plenario', element: <Plenario /> },
      { path: 'plenario/:id/gerenciar', element: <PlenarioGerenciar /> },
      { path: 'plenario/:id', element: <PlenarioAtivo /> },
      { path: 'documentos', element: <Documentos /> },
      { path: 'teletrabalho', element: <Teletrabalho /> },
      { path: 'ouvidoria', element: <Ouvidoria /> },
      { path: 'protocolos', element: <Protocolos /> },
      { path: 'usuarios', element: <Usuarios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
])
