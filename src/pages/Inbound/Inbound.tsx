import React, { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { InboundFilters } from './components/InboundFilters'
import { CreateAsnModal } from './components/CreateAsnModal'
import { ReceivingWorkflowDrawer } from './components/ReceivingWorkflowDrawer'
import { inboundService } from '../../services/inboundService'
import { inventoryService } from '../../services/inventoryService'
import { applySkuMovement } from '../../utils/applySkuMovement'
import { mockWarehouses } from '../../mock-data/warehouses'
import { InboundOrder } from '../../types/inboundOrder'
import { AIInsightCard } from '../../components/ui/AIInsightCard/AIInsightCard'
import { Truck, AlertCircle, Inbox, ArrowDownCircle, CheckSquare, Plus, ChevronRight, PauseCircle } from 'lucide-react'
import styles from './Inbound.module.css'

export const Inbound: React.FC = () => {
  // State
  const [orders, setOrders] = useState<InboundOrder[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [activeTab, setActiveTab] = useState<string>('All')

  // Modals & Drawers
  const [isAsnModalOpen, setIsAsnModalOpen] = useState(false)
  const [isWalkInGrnMode, setIsWalkInGrnMode] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    const data = await inboundService.getInboundOrders()
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Create ASN Handler
  const handleCreateAsn = async (newOrder: Omit<InboundOrder, 'id'>) => {
    const created = await inboundService.createInboundOrder(newOrder)
    setOrders(prev => [created, ...prev])
    setIsAsnModalOpen(false)
  }

  // Walk-in GRN Handler
  const handleCreateWalkInGrn = async (newOrder: Omit<InboundOrder, 'id'>) => {
    const created = await inboundService.createInboundOrder({
      ...newOrder,
      asnNumber: undefined,
      grnNumber: `GRN-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      status: 'Arrived / Gate-In' // Walk-ins bypass ASN phase directly into Gate-In
    })
    setOrders(prev => [created, ...prev])
    setIsWalkInGrnMode(false)
  }

  // Save workflow progression details
  const handleSaveOrderProgress = async (updated: InboundOrder) => {
    const previous = orders.find(o => o.id === updated.id)
    await inboundService.updateInboundOrder(updated)
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))

    // Cross-module effect: applying a receipt to Inventory happens exactly
    // once, the moment the order transitions INTO Completed status — never
    // on every intermediate save, and never twice.
    if (previous && previous.status !== 'Completed' && updated.status === 'Completed') {
      await applyReceiptToInventory(updated)
    }
  }

  // Increments the on-hand quantity (and appends a Receipt/GRN movement) for
  // every accepted line item on a completed inbound order. Line items whose
  // skuId doesn't match a known SKU (e.g. a freshly-created ASN using a
  // placeholder id, since there is no real SKU picker yet) are skipped
  // rather than failing the whole receipt.
  const applyReceiptToInventory = async (order: InboundOrder) => {
    for (const item of order.lineItems) {
      const qty = item.receivedQty ?? item.expectedQty
      if (!qty || item.qualityStatus === 'Rejected') continue
      const sku = await inventoryService.getSKUById(item.skuId)
      if (!sku) continue
      const updatedSku = applySkuMovement(sku, qty, 'Receipt/GRN', {
        user: 'Receiving Workflow',
        reason: `Received via ${order.asnNumber || order.grnNumber || order.id}`
      })
      await inventoryService.updateSKU(updatedSku)
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearch('')
    setSelectedWarehouse('all')
    setSelectedSource('all')
    setActiveTab('All')
  }

  const hasActiveFilters = useMemo(() => {
    return search !== '' || selectedWarehouse !== 'all' || selectedSource !== 'all' || activeTab !== 'All'
  }, [search, selectedWarehouse, selectedSource, activeTab])

  // Pipeline count badge tallies
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: orders.length,
      'Pending ASN': 0,
      'Arrived / Gate-In': 0,
      'Quality Inspection': 0,
      'Putaway Pending': 0,
      Completed: 0,
      'On Hold': 0
    }
    orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++
      }
    })
    return counts
  }, [orders])

  // Filter application
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o => 
        (o.asnNumber && o.asnNumber.toLowerCase().includes(q)) ||
        (o.grnNumber && o.grnNumber.toLowerCase().includes(q)) ||
        o.supplierName.toLowerCase().includes(q) ||
        (o.poReference && o.poReference.toLowerCase().includes(q))
      )
    }

    if (selectedWarehouse !== 'all') {
      result = result.filter(o => o.warehouseId === selectedWarehouse)
    }

    if (selectedSource !== 'all') {
      result = result.filter(o => o.source === selectedSource)
    }

    if (activeTab !== 'All') {
      result = result.filter(o => o.status === activeTab)
    }

    return result
  }, [orders, search, selectedWarehouse, selectedSource, activeTab])

  // KPI Rollups
  const expectedToday = orders.filter(o => o.status === 'Pending ASN').length
  const awaitingInspection = orders.filter(o => o.status === 'Quality Inspection').length
  const putawayPending = orders.filter(o => o.status === 'Putaway Pending').length
  const completedCount = orders.filter(o => o.status === 'Completed').length

  const getStatusBadgeVariant = (status: InboundOrder['status']) => {
    switch (status) {
      case 'Pending ASN': return 'default'
      case 'Arrived / Gate-In': return 'info'
      case 'Quality Inspection': return 'warning'
      case 'Putaway Pending': return 'primary'
      case 'Completed': return 'success'
      case 'On Hold': return 'danger'
      default: return 'secondary'
    }
  }

  const getWarehouseName = (id: string) => {
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  // The linear receiving journey — mirrors the exact stage order the
  // ReceivingWorkflowDrawer stepper already uses. On Hold is deliberately
  // excluded: it's an exception off-ramp, not a sequential stage.
  const pipelineStages = [
    { key: 'Pending ASN', label: 'Pending ASN' },
    { key: 'Arrived / Gate-In', label: 'Gate-In' },
    { key: 'Quality Inspection', label: 'Quality Audit' },
    { key: 'Putaway Pending', label: 'Putaway' },
    { key: 'Completed', label: 'Completed' }
  ]

  const onHoldOrders = orders.filter(o => o.status === 'On Hold')

  const handleRowClick = (order: InboundOrder) => {
    setSelectedOrder(order)
    setIsDrawerOpen(true)
  }

  if (loading) {
    return <div className={styles.loadingState}>Loading inbound order registry...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Receiving Operations"
        title="Inbound Receipts"
        description="Unified receiving pipeline: ASNs, Gate Entry logs, Cargo Weighbridges, and Quality Inspections."
        actions={
          <div className={styles.headerActions}>
            <button onClick={() => setIsWalkInGrnMode(true)} className={styles.btnSecondary}>
              <Plus size={16} />
              <span>Log Walk-in GRN</span>
            </button>
            <button onClick={() => setIsAsnModalOpen(true)} className={styles.btnPrimary}>
              <Plus size={16} />
              <span>Create ASN</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats summary */}
      <div className={styles.kpiGrid}>
        <StatCard
          title="Expected ASNs Today"
          value={expectedToday}
          icon={<Truck size={18} />}
        />
        <StatCard
          title="Awaiting Inspection"
          value={awaitingInspection}
          variant={awaitingInspection > 0 ? 'warning' : 'default'}
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          title="Putaway Pending"
          value={putawayPending}
          icon={<Inbox size={18} />}
        />
        <StatCard
          title="Receipts Completed"
          value={completedCount}
          icon={<CheckSquare size={18} />}
        />
      </div>

      {/* Receiving pipeline — the same statusCounts/activeTab filter, visualized as
          the literal stage-by-stage journey a shipment travels through. */}
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
          onClick={() => setActiveTab('On Hold')}
          className={`${styles.exceptionChip} ${activeTab === 'On Hold' ? styles.exceptionChipActive : ''}`}
        >
          <PauseCircle size={13} />
          <span>On Hold</span>
          <span className={styles.chipCount}>{statusCounts['On Hold']}</span>
        </button>
      </div>

      {/* Exception callout — only surfaces when there's a real shipment blocked */}
      {onHoldOrders.length > 0 && (
        <AIInsightCard
          severity="critical"
          label="Exception Queue"
          title={`${onHoldOrders.length} shipment${onHoldOrders.length > 1 ? 's' : ''} on hold`}
          description={`${onHoldOrders.map(o => `${o.supplierName} (${o.asnNumber || o.grnNumber})`).join(', ')}. These receipts are blocked from progressing through the pipeline.`}
          actionLabel="View On Hold"
          onAction={() => setActiveTab('On Hold')}
        />
      )}

      {/* Filters bar */}
      <InboundFilters
        search={search}
        setSearch={setSearch}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        onClear={handleClearFilters}
        filteredCount={filteredOrders.length}
        totalCount={orders.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Data viewport */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No Inbound Shipments Found"
          description="Clear filters to inspect all scheduled deliveries and gateway receipts."
          action={
            <button onClick={handleClearFilters} className={styles.btnPrimary}>
              Clear Active Filters
            </button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table headers={['ASN / GRN Code', 'Supplier', 'PO Reference', 'Warehouse', 'Expected Date', 'Channel', 'Manifest Items', 'Status']}>
            {filteredOrders.map(o => {
              const totalItems = o.lineItems.reduce((acc, i) => acc + i.expectedQty, 0)
              
              return (
                <tr key={o.id} onClick={() => handleRowClick(o)} className={styles.clickableRow}>
                  <td className={styles.codeCell}>
                    <code>{o.asnNumber || o.grnNumber}</code>
                  </td>
                  <td><strong>{o.supplierName}</strong></td>
                  <td className={styles.poCell}>{o.poReference || '—'}</td>
                  <td>{getWarehouseName(o.warehouseId)}</td>
                  <td>{o.expectedDate}</td>
                  <td>
                    <Badge variant="secondary">{o.source}</Badge>
                  </td>
                  <td>{o.lineItems.length} SKUs ({totalItems.toLocaleString('en-IN')} units)</td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(o.status)}>{o.status}</Badge>
                  </td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}

      {/* ASN Creation Modal */}
      <CreateAsnModal
        isOpen={isAsnModalOpen}
        onClose={() => setIsAsnModalOpen(false)}
        onAdd={handleCreateAsn}
      />

      {/* Walk-in GRN Modal */}
      <CreateAsnModal
        isOpen={isWalkInGrnMode}
        onClose={() => setIsWalkInGrnMode(false)}
        onAdd={handleCreateWalkInGrn}
      />

      {/* Receiving Stepper workflow drawer */}
      <ReceivingWorkflowDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        order={selectedOrder}
        onSave={handleSaveOrderProgress}
      />
    </div>
  )
}

export default Inbound
