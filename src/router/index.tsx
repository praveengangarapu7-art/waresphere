import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../hooks/useAuth'

// Lazy loaded page components
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'))
const Inventory = lazy(() => import('../pages/Inventory/Inventory'))
const InventoryDetail = lazy(() => import('../pages/InventoryDetail/InventoryDetail'))
const Warehouses = lazy(() => import('../pages/Warehouses/Warehouses'))
const WarehouseDetail = lazy(() => import('../pages/WarehouseDetail/WarehouseDetail'))
const Inbound = lazy(() => import('../pages/Inbound/Inbound'))
const Outbound = lazy(() => import('../pages/Outbound/Outbound'))
const Transfers = lazy(() => import('../pages/Transfers/Transfers'))
const ColdStorage = lazy(() => import('../pages/ColdStorage/ColdStorage'))
const CycleCounts = lazy(() => import('../pages/CycleCounts/CycleCounts'))
const BarcodeLabels = lazy(() => import('../pages/BarcodeLabels/BarcodeLabels'))
const Reports = lazy(() => import('../pages/Reports/Reports'))
const AIInsights = lazy(() => import('../pages/AIInsights/AIInsights'))
const Copilot = lazy(() => import('../pages/Copilot/Copilot'))
const Settings = lazy(() => import('../pages/Settings/Settings'))

const Login = lazy(() => import('../pages/Login/Login'))
const Signup = lazy(() => import('../pages/Signup/Signup'))

const LoadingFallback = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
    Loading WareSphere view...
  </div>
)

// ProtectedRoute: Checks if the user is authenticated. If not, redirects to /login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// PublicRoute: Redirects logged-in users away from auth pages to dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  return !user ? <>{children}</> : <Navigate to="/" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<LoadingFallback />}><Inventory /></Suspense> },
      { path: 'inventory/:skuId', element: <Suspense fallback={<LoadingFallback />}><InventoryDetail /></Suspense> },
      { path: 'warehouses', element: <Suspense fallback={<LoadingFallback />}><Warehouses /></Suspense> },
      { path: 'warehouses/:warehouseId', element: <Suspense fallback={<LoadingFallback />}><WarehouseDetail /></Suspense> },
      { path: 'inbound', element: <Suspense fallback={<LoadingFallback />}><Inbound /></Suspense> },
      { path: 'outbound', element: <Suspense fallback={<LoadingFallback />}><Outbound /></Suspense> },
      { path: 'transfers', element: <Suspense fallback={<LoadingFallback />}><Transfers /></Suspense> },
      { path: 'cold-storage', element: <Suspense fallback={<LoadingFallback />}><ColdStorage /></Suspense> },
      { path: 'cycle-counts', element: <Suspense fallback={<LoadingFallback />}><CycleCounts /></Suspense> },
      { path: 'barcode-labels', element: <Suspense fallback={<LoadingFallback />}><BarcodeLabels /></Suspense> },
      { path: 'reports', element: <Suspense fallback={<LoadingFallback />}><Reports /></Suspense> },
      { path: 'ai-insights', element: <Suspense fallback={<LoadingFallback />}><AIInsights /></Suspense> },
      { path: 'copilot', element: <Suspense fallback={<LoadingFallback />}><Copilot /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<LoadingFallback />}><Settings /></Suspense> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  },
  {
    path: '/',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: 'login', element: <Suspense fallback={<LoadingFallback />}><Login /></Suspense> },
      { path: 'signup', element: <Suspense fallback={<LoadingFallback />}><Signup /></Suspense> }
    ]
  }
])
