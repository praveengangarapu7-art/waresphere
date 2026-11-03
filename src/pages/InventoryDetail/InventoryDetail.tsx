import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { Badge } from '../../components/ui/Badge/Badge'
import { Modal } from '../../components/ui/Modal/Modal'
import { inventoryService } from '../../services/inventoryService'
import { SKU } from '../../types/sku'
import { formatCurrency } from '../../utils/formatCurrency'
import { applySkuMovement } from '../../utils/applySkuMovement'
import {
  LocationsTab,
  BatchGenealogyTab,
  MovementHistoryTab,
  ValuationAgingTab
} from './components'
import {
  Printer,
  Sliders,
  ArrowRightLeft,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Layers,
  Thermometer,
  ShieldAlert
} from 'lucide-react'
import styles from './InventoryDetail.module.css'

export const InventoryDetail: React.FC = () => {
  const { skuId } = useParams<{ skuId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeRole } = useRole()
  
  // Local state for interactive stock adjustment
  const [sku, setSku] = useState<SKU | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('locations')
  
  // Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState<string>('Counting Variance')

  useEffect(() => {
    const fetchSKU = async () => {
      if (skuId) {
        setLoading(true)
        const data = await inventoryService.getSKUById(skuId)
        if (data) {
          setSku(data)
        }
        setLoading(false)
      }
    }
    fetchSKU()
  }, [skuId])

  if (loading) {
    return <div className={styles.loadingState}>Loading SKU detail trail...</div>
  }

  if (!sku) {
    return (
      <div className={styles.notFound}>
        <h3>SKU Record Not Found</h3>
        <p>The requested inventory identifier does not exist in the active ledger.</p>
        <Link to="/inventory" className={styles.backLink}>Back to Inventory Ledger</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'locations', label: 'Storage Bins' },
    { id: 'batches', label: 'Batches & Genealogy' },
    { id: 'movements', label: 'Movement History' },
    { id: 'valuation', label: 'Valuation & Aging' }
  ]

  // Submit stock adjustment handler — persists via inventoryService.updateSKU
  // so the change survives navigation for the rest of the session, instead
  // of only ever existing in this component's local state.
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (adjustQty === 0) {
      alert('Adjustment quantity delta cannot be zero.')
      return
    }

    if (sku.quantity + adjustQty < 0) {
      alert('Insufficient stock. Quantity cannot fall below zero.')
      return
    }

    const updated = applySkuMovement(sku, adjustQty, 'Adjustment', {
      user: user?.name || 'Ranjit Singh',
      reason: adjustReason
    })
    await inventoryService.updateSKU(updated)
    setSku(updated)

    setIsAdjustModalOpen(false)
    setAdjustQty(0)
  }

  // Formatting Expiry details
  const getExpiryDisplay = () => {
    if (!sku.expiryDate) return 'No Expiry Tracking'
    const today = new Date()
    const expiry = new Date(sku.expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Expired'
    if (diffDays <= 30) return `${sku.expiryDate} (Expiring Soon)`
    return sku.expiryDate
  }

  const isLowStock = sku.quantity <= sku.reorderPoint
  const isExpiring = sku.expiryDate && (new Date(sku.expiryDate).getTime() - new Date().getTime()) < 30 * 24 * 60 * 60 * 1000
  const isAuditor = activeRole === 'External Auditor'

  // Safety Stock Gauge Percentage
  const gaugePercent = Math.min(100, Math.max(0, (sku.quantity / (sku.reorderPoint * 2)) * 100))

  return (
    <div className={styles.container}>
      {/* Breadcrumbs Row */}
      <div className={styles.breadcrumbs}>
        <Link to="/inventory" className={styles.crumbLink}>Inventory</Link>
        <ChevronRight size={14} />
        <span className={styles.crumbCurrent}>{sku.name}</span>
      </div>

      {/* Detail Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>{sku.name}</h1>
          <div className={styles.badgeRow}>
            <code>{sku.skuCode}</code>
            <Badge variant="primary">{sku.category}</Badge>
            <Badge variant={sku.abcClass === 'A' ? 'warning' : 'default'}>
              Class {sku.abcClass}
            </Badge>
          </div>
        </div>

        {/* Detail Actions */}
        {!isAuditor && (
          <div className={styles.actions}>
            <button onClick={() => alert('Printing physical rack/barcode label...')} className={styles.btnSecondary}>
              <Printer size={16} />
              <span>Print Label</span>
            </button>
            <button onClick={() => setIsAdjustModalOpen(true)} className={styles.btnSecondary}>
              <Sliders size={16} />
              <span>Adjust Stock</span>
            </button>
            <button onClick={() => navigate('/transfers')} className={styles.btnPrimary}>
              <ArrowRightLeft size={16} />
              <span>Transfer Stock</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary strip cards */}
      <div className={styles.summaryStrip}>
        <StatCard
          title="On-Hand Balance"
          value={`${sku.quantity.toLocaleString('en-IN')} ${sku.unit}`}
          icon={<Layers size={18} />}
        />
        <StatCard
          title="Inventory Asset Value"
          value={formatCurrency(sku.totalValue)}
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          title="Reorder Threshold"
          value={`${sku.reorderPoint.toLocaleString('en-IN')} ${sku.unit}`}
          variant={isLowStock ? 'warning' : 'default'}
          description={isLowStock ? 'Stock level fell below reorder limits' : 'Stock level is healthy'}
        />
        {sku.expiryDate && (
          <StatCard
            title="Nearest Batch Expiry"
            value={getExpiryDisplay()}
            variant={isExpiring ? 'danger' : 'default'}
          />
        )}
      </div>

      {/* Main split grid */}
      <div className={styles.mainGrid}>
        {/* Left main column: Tabs & Lists */}
        <div className={styles.leftCol}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          
          <div className={styles.tabContentArea}>
            {activeTab === 'locations' && (
              <LocationsTab locations={sku.locations} unit={sku.unit} isAuditor={isAuditor} />
            )}
            {activeTab === 'batches' && (
              <BatchGenealogyTab batches={sku.batches} unit={sku.unit} />
            )}
            {activeTab === 'movements' && (
              <MovementHistoryTab movements={sku.movements} unit={sku.unit} />
            )}
            {activeTab === 'valuation' && (
              <ValuationAgingTab
                valuationMethod={sku.valuationMethod}
                unitCost={sku.unitCost}
                totalValue={sku.totalValue}
                valuationHistory={sku.valuationHistory}
                batches={sku.batches}
                unit={sku.unit}
              />
            )}
          </div>
        </div>

        {/* Right sidebar column: Attributes & AI widgets */}
        <div className={styles.rightCol}>
          {/* Reorder Safety Gauge Widget */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <Sparkles size={16} className={styles.aiSparkIcon} />
              <h4>AI Recommendation</h4>
            </div>
            
            <div className={styles.gaugeContainer}>
              <div className={styles.gaugeHeader}>
                <span className={styles.gaugeLabel}>Safety Stock Buffer</span>
                <span className={styles.gaugeVal}>{sku.quantity.toLocaleString()} / {sku.reorderPoint.toLocaleString()}</span>
              </div>
              <div className={styles.gaugeTrack}>
                <div 
                  className={`${styles.gaugeFill} ${isLowStock ? styles.fillWarning : styles.fillPrimary}`} 
                  style={{ width: `${gaugePercent}%` }} 
                />
              </div>
            </div>

            <p className={styles.aiRecommendationText}>
              {isLowStock 
                ? `Reorder recommendation generated: Request procurement of 500 ${sku.unit} by July 18 to mitigate supply gaps.`
                : 'Stock replenishment schedules are optimal. No immediate reorders required.'
              }
            </p>
            {!isAuditor && (
              <Link to="/ai-insights" className={styles.aiLink}>
                View replenishment insights
              </Link>
            )}
          </div>

          {/* SKU Core attributes details */}
          <div className={styles.sidebarCard}>
            <h4 className={styles.sidebarCardTitle}>SKU Specifications</h4>
            <div className={styles.attrsList}>
              <div className={styles.attr}>
                <span className={styles.attrLabel}>HSN / Tariff Code</span>
                <span className={styles.attrVal}>3004.90.99</span>
              </div>
              <div className={styles.attr}>
                <span className={styles.attrLabel}>Valuation Method</span>
                <span className={styles.attrVal}>{sku.valuationMethod}</span>
              </div>
              {sku.category === 'Pharma' && (
                <>
                  <div className={styles.attr}>
                    <span className={styles.attrLabel}>Temp Zone</span>
                    <span className={styles.attrVal}>Cold Chain (2°C - 8°C)</span>
                  </div>
                  <div className={styles.attr}>
                    <span className={styles.attrLabel}>Storage Specs</span>
                    <span className={styles.attrVal}>Keep away from direct sunlight</span>
                  </div>
                </>
              )}
              {sku.category === 'Chemicals' && (
                <div className={styles.attr}>
                  <span className={styles.attrLabel}>Hazmat Class</span>
                  <span className={styles.attrVal}>Class 8 (Corrosive)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Stock Dialog Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Stock Quantity Ledger"
      >
        <form onSubmit={handleAdjustmentSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="adjust-qty" className={styles.label}>
              Adjustment Quantity Delta (+/-)
            </label>
            <input
              type="number"
              id="adjust-qty"
              value={adjustQty}
              onChange={(e) => setAdjustQty(Number(e.target.value))}
              placeholder="e.g. -10 or 25"
              required
              className={styles.input}
            />
            <p className={styles.helpText}>
              Input positive number to add stock receipts, or negative number to adjust for loss/spill.
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="adjust-reason" className={styles.label}>
              Operational Reason Code
            </label>
            <select
              id="adjust-reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className={styles.select}
            >
              <option value="Counting Variance">Counting Variance</option>
              <option value="Damage">Damage</option>
              <option value="Shrinkage">Shrinkage</option>
              <option value="Spillage">Spillage</option>
              <option value="Expiry Disposal">Expiry Disposal</option>
              <option value="Theft">Theft</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className={styles.btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Commit Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default InventoryDetail
