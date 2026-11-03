import React, { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { TransferFilters } from './components/TransferFilters'
import { NewMovementMenu } from './components/NewMovementMenu'
import { CreateMovementModal } from './components/modals/CreateMovementModal'
import { MovementDetailDrawer } from './components/MovementDetailDrawer'
import { movementService } from '../../services/movementService'
import { inventoryService } from '../../services/inventoryService'
import { applySkuMovement } from '../../utils/applySkuMovement'
import { mockWarehouses } from '../../mock-data/warehouses'
import { StockMovement } from '../../types/movement'
import {
  Truck,
  Box,
  AlertCircle,
  RotateCcw,
  Layers,
  HardDrive,
  User,
  CheckCircle,
  Plus
} from 'lucide-react'
import styles from './Transfers.module.css'

export const Transfers: React.FC = () => {
  // State
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [activeTab, setActiveTab] = useState<string>('All')

  // Modals & Drawer
  const [selectedCreateType, setSelectedCreateType] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fetchMovements = async () => {
    setLoading(true)
    const data = await movementService.getMovements()
    setMovements(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMovements()
  }, [])

  // Create Movement callback
  const handleCreateMovement = async (newMov: Omit<StockMovement, 'id'>) => {
    const created = await movementService.createMovement(newMov)
    setMovements(prev => [created, ...prev])
    setIsCreateModalOpen(false)
  }

  // Save/approve callback
  const handleSaveMovementProgress = async (updated: StockMovement) => {
    const previous = movements.find(m => m.id === updated.id)
    await movementService.updateMovement(updated)
    setMovements(prev => prev.map(m => m.id === updated.id ? updated : m))

    // Keep active selection in drawer in-sync
    if (selectedMovement?.id === updated.id) {
      setSelectedMovement(updated)
    }

    // Cross-module effect: a Stock Adjustment's quantity delta is applied to
    // Inventory the moment it's Approved — scoped to this one movement type
    // for now, since Transfer/BinMove/Return/Kitting/MaterialIssue each
    // imply different inventory semantics not yet modeled here.
    if (
      previous &&
      updated.type === 'Stock Adjustment' &&
      previous.status !== 'Approved' &&
      updated.status === 'Approved'
    ) {
      await applyAdjustmentToInventory(updated)
    }
  }

  const applyAdjustmentToInventory = async (movement: StockMovement) => {
    for (const item of movement.lineItems) {
      const sku = await inventoryService.getSKUById(item.skuId)
      if (!sku) continue
      const updatedSku = applySkuMovement(sku, item.quantity, 'Adjustment', {
        user: movement.approvedBy || 'Transfers Workflow',
        reason: movement.reasonCode || `Adjustment ${movement.movementNumber}`
      })
      await inventoryService.updateSKU(updatedSku)
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearch('')
    setSelectedWarehouse('all')
    setSelectedStatus('all')
    setActiveTab('All')
  }

  const hasActiveFilters = useMemo(() => {
    return search !== '' || selectedWarehouse !== 'all' || selectedStatus !== 'all' || activeTab !== 'All'
  }, [search, selectedWarehouse, selectedStatus, activeTab])

  // Split-button dropdown menu selection
  const handleMenuSelect = (option: string) => {
    setSelectedCreateType(option)
    setIsCreateModalOpen(true)
  }

  // Row type icon decider
  const getRowIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'Inter-Warehouse Transfer': return <Truck size={14} />
      case 'Bin-to-Bin Move': return <Box size={14} />
      case 'Stock Adjustment': return <AlertCircle size={14} />
      case 'Customer Return':
      case 'Supplier Return': return <RotateCcw size={14} />
      case 'Kit Assembly':
      case 'Kit Disassembly': return <Layers size={14} />
      case 'Material Issue': return <HardDrive size={14} />
      default: return <Box size={14} />
    }
  }

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: movements.length,
      Transfers: 0,
      'Bin Moves': 0,
      Adjustments: 0,
      Returns: 0,
      Kitting: 0,
      Issues: 0
    }
    movements.forEach(m => {
      if (m.type === 'Inter-Warehouse Transfer') counts.Transfers++
      else if (m.type === 'Bin-to-Bin Move') counts['Bin Moves']++
      else if (m.type === 'Stock Adjustment') counts.Adjustments++
      else if (m.type.includes('Return')) counts.Returns++
      else if (m.type.includes('Kit')) counts.Kitting++
      else if (m.type === 'Material Issue') counts.Issues++
    })
    return counts
  }, [movements])

  // Filter application
  const filteredMovements = useMemo(() => {
    let result = [...movements]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m => 
        m.movementNumber.toLowerCase().includes(q) ||
        m.requestedBy.toLowerCase().includes(q) ||
        m.lineItems.some(i => i.skuId.toLowerCase().includes(q))
      )
    }

    if (selectedWarehouse !== 'all') {
      result = result.filter(m => m.fromWarehouseId === selectedWarehouse || m.toWarehouseId === selectedWarehouse)
    }

    if (selectedStatus !== 'all') {
      result = result.filter(m => m.status === selectedStatus)
    }

    if (activeTab !== 'All') {
      result = result.filter(m => {
        if (activeTab === 'Transfers') return m.type === 'Inter-Warehouse Transfer'
        if (activeTab === 'Bin Moves') return m.type === 'Bin-to-Bin Move'
        if (activeTab === 'Adjustments') return m.type === 'Stock Adjustment'
        if (activeTab === 'Returns') return m.type.includes('Return')
        if (activeTab === 'Kitting') return m.type.includes('Kit')
        if (activeTab === 'Issues') return m.type === 'Material Issue'
        return true
      })
    }

    return result
  }, [movements, search, selectedWarehouse, selectedStatus, activeTab])

  // KPI Rollups
  const pendingApprovals = movements.filter(m => m.status === 'Pending Approval').length
  const inTransitCount = movements.filter(m => m.status === 'In Transit').length
  const adjustmentsCount = movements.filter(m => m.type === 'Stock Adjustment').length
  const returnsCount = movements.filter(m => m.type.includes('Return') && m.status === 'Requested').length

  const getStatusBadgeVariant = (status: StockMovement['status']) => {
    switch (status) {
      case 'Requested': return 'default'
      case 'Pending Approval': return 'warning'
      case 'Approved': return 'success'
      case 'In Transit': return 'info'
      case 'Received':
      case 'Completed': return 'success'
      case 'Rejected': return 'danger'
      default: return 'secondary'
    }
  }

  const getWarehouseName = (id?: string) => {
    if (!id) return '—'
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  const handleRowClick = (m: StockMovement) => {
    setSelectedMovement(m)
    isDrawerOpen ? setIsDrawerOpen(false) : null // Close previous
    setTimeout(() => {
      setIsDrawerOpen(true)
    }, 100)
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Stock Transfers & Movements"
        description="Unified logging of internal warehouse kitting, inventory adjustments, and facility-to-facility transfers."
        actions={
          <div className={styles.headerActions}>
            <NewMovementMenu onSelect={handleMenuSelect} />
          </div>
        }
      />

      {/* KPI stats strip */}
      <div className={styles.kpiGrid}>
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          variant={pendingApprovals > 0 ? 'warning' : 'default'}
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          title="Transfers In Transit"
          value={inTransitCount}
          icon={<Truck size={18} />}
        />
        <StatCard
          title="Adjustments Logged"
          value={adjustmentsCount}
          icon={<Layers size={18} />}
        />
        <StatCard
          title="Returns Awaiting Quality"
          value={returnsCount}
          variant={returnsCount > 0 ? 'warning' : 'default'}
          icon={<RotateCcw size={18} />}
        />
      </div>

      {/* Tab filters */}
      <div className={styles.tabContainer}>
        {Object.keys(tabCounts).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            <span>{tab}</span>
            <span className={styles.tabBadge}>{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <TransferFilters
        search={search}
        setSearch={setSearch}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onClear={handleClearFilters}
        filteredCount={filteredMovements.length}
        totalCount={movements.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table viewport */}
      {filteredMovements.length === 0 ? (
        <EmptyState
          title="No Inventory Movements Logged"
          description="Clear filters to inspect all logged warehouse transfers."
          action={
            <button onClick={handleClearFilters} className={styles.btnPrimary}>
              Clear Active Filters
            </button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table headers={['Movement ID', 'Type Profile', 'From Location', 'To Location', 'Manifest SKUs', 'Total Qty', 'Reason Code', 'Status']}>
            {filteredMovements.map(m => {
              const totalItems = m.lineItems.reduce((acc, i) => acc + Math.abs(i.quantity), 0)
              const fromStr = m.fromBin ? `${getWarehouseName(m.fromWarehouseId)} · ${m.fromBin}` : getWarehouseName(m.fromWarehouseId)
              const toStr = m.toBin ? `${getWarehouseName(m.fromWarehouseId)} · ${m.toBin}` : getWarehouseName(m.toWarehouseId)

              return (
                <tr key={m.id} onClick={() => handleRowClick(m)} className={styles.clickableRow}>
                  <td className={styles.codeCell}>
                    <code>{m.movementNumber}</code>
                  </td>
                  <td>
                    <div className={styles.typeCell}>
                      {getRowIcon(m.type)}
                      <span>{m.type}</span>
                    </div>
                  </td>
                  <td>{fromStr}</td>
                  <td>{toStr}</td>
                  <td>{m.lineItems.length} SKU(s)</td>
                  <td className={m.type === 'Stock Adjustment' && totalItems > 1000 ? styles.warnText : ''}>
                    <strong>{totalItems.toLocaleString('en-IN')} units</strong>
                  </td>
                  <td>{m.reasonCode || '—'}</td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(m.status)}>{m.status}</Badge>
                  </td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}

      {/* Creator Modal */}
      <CreateMovementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        type={selectedCreateType}
        onAdd={handleCreateMovement}
      />

      {/* Detail Drawer overlay */}
      <MovementDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        movement={selectedMovement}
        onSave={handleSaveMovementProgress}
      />
    </div>
  )
}

export default Transfers
