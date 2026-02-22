import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage'
import { LoginPage } from '@/components/auth/LoginPage'
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { MasterLayout } from '@/components/master/MasterLayout'
import { Dashboard } from '@/pages/backoffice/Dashboard'
import { Legislativo } from '@/pages/backoffice/Legislativo'
import { LeiDetalhe } from '@/pages/backoffice/LeiDetalhe'
import { LeiNova } from '@/pages/backoffice/LeiNova'
import { LeisList } from '@/pages/backoffice/LeisList'
import { Plenario } from '@/pages/backoffice/Plenario'
import { PlenarioAtivo } from '@/pages/backoffice/PlenarioAtivo'
import { PlenarioGerenciar } from '@/pages/backoffice/PlenarioGerenciar'
import { ProposicaoDetalhe } from '@/pages/backoffice/ProposicaoDetalhe'
import { ProposicaoNova } from '@/pages/backoffice/ProposicaoNova'
import { AuditLog } from '@/pages/master/AuditLog'
import { CamarasList } from '@/pages/master/CamarasList'
import { MasterConfiguracoes } from '@/pages/master/MasterConfiguracoes'
import { MasterDashboard } from '@/pages/master/MasterDashboard'
import { ProvisionarCamara } from '@/pages/master/ProvisionarCamara'
import { PortalPublico } from '@/pages/transparencia/PortalPublico'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { MasterGuard } from './MasterGuard'

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
    element: <PortalPublico />,
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
    ],
  },
])
