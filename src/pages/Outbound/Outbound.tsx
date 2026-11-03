import React, { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { OutboundFilters } from './components/OutboundFilters'
import { CreateOutboundOrderModal } from './components/CreateOutboundOrderModal'
import { DispatchWorkflowDrawer } from './components/DispatchWorkflowDrawer'
import { outboundService } from '../../services/outboundService'
import { inventoryService } from '../../services/inventoryService'
import { applySkuMovement } from '../../utils/applySkuMovement'
import { mockWarehouses } from '../../mock-data/warehouses'
import { OutboundOrder } from '../../types/outboundOrder'
import { formatCurrency } from '../../utils/formatCurrency'
import { AIInsightCard } from '../../components/ui/AIInsightCard/AIInsightCard'
import { Truck, Inbox, FileText, AlertCircle, Plus, FileSpreadsheet, CheckSquare, ChevronRight, AlertTriangle } from 'lucide-react'
import styles from './Outbound.module.css'

export const Outbound: React.FC = () => {
  // State
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStrategy, setSelectedStrategy] = useState('all')
  const [activeTab, setActiveTab] = useState<string>('All')

  // Modals & Drawer Toggles
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    const data = await outboundService.getOutboundOrders()
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Create Order Callback
  const handleCreateOrder = async (newOrder: Omit<OutboundOrder, 'id'>) => {
    const created = await outboundService.createOutboundOrder(newOrder)
    setOrders(prev => [created, ...prev])
    setIsCreateModalOpen(false)
  }

  // Save progress callback
  const handleSaveOrderProgress = async (updated: OutboundOrder) => {
    const previous = orders.find(o => o.id === updated.id)
    await outboundService.updateOutboundOrder(updated)
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))

    // Cross-module effect: decrementing Inventory happens exactly once, the
    // moment the order transitions INTO Dispatched status (goods physically
    // leave the warehouse) — never on every intermediate save, never twice.
    if (previous && previous.status !== 'Dispatched' && updated.status === 'Dispatched') {
      await applyDispatchToInventory(updated)
    }
  }

  // Decrements the on-hand quantity (and appends a Dispatch movement) for
  // every picked/packed line item on a dispatched outbound order. Line
  // items whose skuId doesn't match a known SKU are skipped rather than
  // failing the whole dispatch.
  const applyDispatchToInventory = async (order: OutboundOrder) => {
    for (const item of order.lineItems) {
      const qty = item.packedQty ?? item.pickedQty ?? item.orderedQty
      if (!qty) continue
      const sku = await inventoryService.getSKUById(item.skuId)
      if (!sku) continue
      const updatedSku = applySkuMovement(sku, -qty, 'Dispatch', {
        user: 'Dispatch Workflow',
        reason: `Dispatched via ${order.orderNumber}`
      })
      await inventoryService.updateSKU(updatedSku)
    }
  }

  // Clear filters helper
  const handleClearFilters = () => {
    setSearch('')
    setSelectedWarehouse('all')
    setSelectedType('all')
    setSelectedStrategy('all')
    setActiveTab('All')
  }

  const hasActiveFilters = useMemo(() => {
    return search !== '' || selectedWarehouse !== 'all' || selectedType !== 'all' || selectedStrategy !== 'all' || activeTab !== 'All'
  }, [search, selectedWarehouse, selectedType, selectedStrategy, activeTab])

  // A shipment is at risk when its required dispatch date has already
  // passed but the cargo hasn't actually left the building yet. Derived
  // purely from fields every order already carries — no new data.
  const isOverdue = (o: OutboundOrder) => {
    const inTransitOrDone = ['Dispatched', 'In Transit', 'Delivered'].includes(o.status)
    return !inTransitOrDone && new Date(o.requiredDispatchDate) < new Date(new Date().toDateString())
  }

  const delayedOrders = orders.filter(isOverdue)

  // The outbound journey — mirrors the exact stage order the
  // DispatchWorkflowDrawer stepper already uses.
  const pipelineStages = [
    { key: 'Pending', label: 'Pending' },
    { key: 'Allocated', label: 'Allocated' },
    { key: 'Picking', label: 'Picking' },
    { key: 'Packed', label: 'Packed' },
    { key: 'Dispatched', label: 'Dispatched' },
    { key: 'Delivered', label: 'Delivered' }
  ]

  // Count tab tallies
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: orders.length,
      Pending: 0,
      Allocated: 0,
      Picking: 0,
      Packed: 0,
      Dispatched: 0,
      Delivered: 0
    }
    orders.forEach(o => {
      // Group Picked with Picking, Loaded with Dispatched for tab simplification
      let statusKey = o.status
      if (statusKey === 'Picked') statusKey = 'Picking'
      if (statusKey === 'Loaded' || statusKey === 'In Transit') statusKey = 'Dispatched'
      
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++
      }
    })
    return counts
  }, [orders])

  // Apply filters
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      )
    }

    if (selectedWarehouse !== 'all') {
      result = result.filter(o => o.warehouseId === selectedWarehouse)
    }

    if (selectedType !== 'all') {
      result = result.filter(o => o.orderType === selectedType)
    }

    if (selectedStrategy !== 'all') {
      result = result.filter(o => o.pickingStrategy === selectedStrategy)
    }

    if (activeTab === 'Delayed') {
      result = result.filter(isOverdue)
    } else if (activeTab !== 'All') {
      result = result.filter(o => {
        let statusKey = o.status
        if (statusKey === 'Picked') statusKey = 'Picking'
        if (statusKey === 'Loaded' || statusKey === 'In Transit') statusKey = 'Dispatched'
        return statusKey === activeTab
      })
    }

    return result
  }, [orders, search, selectedWarehouse, selectedType, selectedStrategy, activeTab])

  // KPI Rollups
  const pendingAllocation = orders.filter(o => o.status === 'Pending').length
  const pickingPacking = orders.filter(o => ['Picking', 'Picked', 'Packed'].includes(o.status)).length
  const readyToDispatch = orders.filter(o => o.status === 'Loaded').length
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length

  const getStatusBadgeVariant = (status: OutboundOrder['status']) => {
    switch (status) {
      case 'Pending': return 'default'
      case 'Allocated': return 'secondary'
      case 'Picking':
      case 'Picked': return 'info'
      case 'Packed': return 'warning'
      case 'Loaded':
      case 'Dispatched':
      case 'In Transit': return 'primary'
      case 'Delivered': return 'success'
      default: return 'secondary'
    }
  }

  const getWarehouseName = (id: string) => {
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  const handleRowClick = (order: OutboundOrder) => {
    setSelectedOrder(order)
    setIsDrawerOpen(true)
  }

  if (loading) {
    return <div className={styles.loadingState}>Loading outbound order logs...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Dispatch Operations"
        title="Outbound Dispatches"
        description="Unified dispatch pipeline: Allocation reservation, Picking optimizations, Carton Packing checklists, and POD sign-offs."
        actions={
          <div className={styles.headerActions}>
            <button onClick={() => setIsCreateModalOpen(true)} className={styles.btnPrimary}>
              <Plus size={16} />
              <span>Create Order</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats summary */}
      <div className={styles.kpiGrid}>
        <StatCard
          title="Awaiting Stock Allocation"
          value={pendingAllocation}
          variant={pendingAllocation > 0 ? 'warning' : 'default'}
          icon={<Inbox size={18} />}
        />
        <StatCard
          title="In Picking / Packing"
          value={pickingPacking}
          icon={<FileSpreadsheet size={18} />}
        />
        <StatCard
          title="Loaded (Ready to Go)"
          value={readyToDispatch}
          icon={<Truck size={18} />}
        />
        <StatCard
          title="Delivered This Week"
          value={deliveredCount}
          icon={<CheckSquare size={18} />}
        />
      </div>

      {/* Dispatch pipeline — the same statusCounts/activeTab filter, visualized as
          the literal stage-by-stage journey an outbound order travels through. */}
      <div className={styles.pipelineRow}>
        <button
          onClick={() => setActiveTab('All')}
          className={`${styles.overviewChip} ${activeTab === 'All' ? styles.overviewChipActive : ''}`}
        >
          <span>All</span>
          <span className={styles.chipCount}>{statusCounts.All}</span>
        </button>

        <div className={styles.pipelineFlow}>
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.key}>
              <button
                onClick={() => setActiveTab(stage.key)}
                className={`${styles.stageChip} ${activeTab === stage.key ? styles.stageChipActive : ''}`}
              >
                <span>{stage.label}</span>
                <span className={styles.chipCount}>{statusCounts[stage.key]}</span>
              </button>
              {idx < pipelineStages.length - 1 && (
                <ChevronRight size={14} className={styles.flowArrow} />
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => setActiveTab('Delayed')}
          className={`${styles.exceptionChip} ${activeTab === 'Delayed' ? styles.exceptionChipActive : ''}`}
        >
          <AlertTriangle size={13} />
          <span>Delayed</span>
          <span className={styles.chipCount}>{delayedOrders.length}</span>
        </button>
      </div>

      {/* Delivery risk callout — only surfaces when a shipment has actually missed its required dispatch date */}
      {delayedOrders.length > 0 && (
        <AIInsightCard
          severity="critical"
          label="Delivery Risk"
          title={`${delayedOrders.length} shipment${delayedOrders.length > 1 ? 's' : ''} past required dispatch date`}
          description={`${delayedOrders.map(o => `${o.customerName} (${o.orderNumber})`).join(', ')}. These orders are still in the pipeline after their committed dispatch window.`}
          actionLabel="View Delayed"
          onAction={() => setActiveTab('Delayed')}
        />
      )}

      {/* Filters bar */}
      <OutboundFilters
        search={search}
        setSearch={setSearch}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStrategy={selectedStrategy}
        setSelectedStrategy={setSelectedStrategy}
        onClear={handleClearFilters}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Data viewport */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Outbound Shipments Found"
          description="Clear filters to inspect all scheduled customer dispatches."
          action={
            <button onClick={handleClearFilters} className={styles.btnPrimary}>
              Clear Active Filters
            </button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table headers={['Order Number', 'Customer / Consignee', 'Type', 'Warehouse', 'Dispatch Target', 'Manifest Items', 'Invoice Value', 'Compliance', 'Status']}>
            {filteredOrders.map(o => {
              const totalItems = o.lineItems.reduce((acc, i) => acc + i.orderedQty, 0)
              const hasEwayBill = o.invoiceValue > 50000
              const overdue = isOverdue(o)

              return (
                <tr key={o.id} onClick={() => handleRowClick(o)} className={styles.clickableRow}>
                  <td className={styles.codeCell}>
                    <code>{o.orderNumber}</code>
                  </td>
                  <td className={styles.customerCell}>
                    <strong>{o.customerName}</strong>
                    <span className={styles.destinationText}>{o.consigneeState}</span>
                  </td>
                  <td>
                    <Badge variant="secondary">{o.orderType}</Badge>
                  </td>
                  <td>{getWarehouseName(o.warehouseId)}</td>
                  <td>
                    <span className={overdue ? styles.overdueDate : undefined}>{o.requiredDispatchDate}</span>
                    {overdue && <span className={styles.overdueTag}>Overdue</span>}
                  </td>
                  <td>{o.lineItems.length} SKUs ({totalItems.toLocaleString('en-IN')} units)</td>
                  <td className={styles.invoiceCell}>
                    <strong>{formatCurrency(o.invoiceValue)}</strong>
                  </td>
                  <td>
                    {hasEwayBill ? (
                      <Badge variant="warning">e-Way Bill Req</Badge>
                    ) : (
                      <span className={styles.naText}>Standard invoice</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(o.status)}>{o.status}</Badge>
                  </td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOutboundOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={handleCreateOrder}
      />

      {/* Dispatch Stepper workflow drawer */}
      <DispatchWorkflowDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        order={selectedOrder}
        onSave={handleSaveOrderProgress}
      />
    </div>
  )
}

export default Outbound
