import { ROLES, UserRole } from './roles'

export interface NavItem {
  name: string
  path: string
  icon: string
  roles?: UserRole[]
}

// Every role except External Auditor — Auditor is consistently treated as
// strictly read-only/oversight-only across every existing page (Dashboard,
// WarehouseDetail, InventoryDetail, Reports all gate operational actions
// behind isAuditor checks), so these two floor-operations tools are hidden
// from the nav for that role rather than just having their buttons disabled
// once inside. No other role is restricted here — every other existing
// per-page role gate is a within-page action/tab, not a whole-page block,
// so this is the one place that pattern extends to the nav level.
const NON_AUDITOR_ROLES: UserRole[] = ROLES.filter(r => r !== 'External Auditor')

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { name: 'Inventory', path: '/inventory', icon: 'Package' },
  { name: 'Warehouses', path: '/warehouses', icon: 'Warehouse' },
  { name: 'Inbound Orders', path: '/inbound', icon: 'Download' },
  { name: 'Outbound Orders', path: '/outbound', icon: 'Upload' },
  { name: 'Stock Transfers', path: '/transfers', icon: 'ArrowLeftRight' },
  { name: 'Cold Storage', path: '/cold-storage', icon: 'ThermometerSnowflake' },
  { name: 'Cycle Counts', path: '/cycle-counts', icon: 'ClipboardCheck', roles: NON_AUDITOR_ROLES },
  { name: 'Barcode & Labels', path: '/barcode-labels', icon: 'QrCode', roles: NON_AUDITOR_ROLES },
  { name: 'Reports', path: '/reports', icon: 'BarChart3' },
  { name: 'AI Insights', path: '/ai-insights', icon: 'Sparkles' },
  { name: 'AI Warehouse Copilot', path: '/copilot', icon: 'Bot' },
  { name: 'Settings', path: '/settings', icon: 'Settings' }
]
