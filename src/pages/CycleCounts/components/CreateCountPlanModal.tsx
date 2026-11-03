import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { CycleCount } from '../../../types/cycleCount'
import { AlertTriangle } from 'lucide-react'
import styles from './CreateCountPlanModal.module.css'

interface CreateCountPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (plan: Omit<CycleCount, 'id'>) => void
}

export const CreateCountPlanModal: React.FC<CreateCountPlanModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [warehouseId, setWarehouseId] = useState(mockWarehouses[0]?.id || '')
  const [strategy, setStrategy] = useState<CycleCount['strategy']>('ABC-Based')
  const [scheduledDate, setScheduledDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [isBlindCount, setIsBlindCount] = useState(true)

  // Scope picker states
  const [abcClass, setAbcClass] = useState<'Class A SKUs' | 'Class B SKUs' | 'Class C SKUs'>('Class A SKUs')
  const [zonePick, setZonePick] = useState('Zone A')
  const [sampleSize, setSampleSize] = useState('20 SKUs')
  const [eventNote, setEventNote] = useState('Spill event audit')

  const getStrategyDescription = (st: CycleCount['strategy']) => {
    switch (st) {
      case 'ABC-Based': return 'Focuses audit on high-value ABC classes (A, B, or C).'
      case 'Zone-Based': return 'Focuses audit on a specific physical sector or warehouse zone.'
      case 'Random Sampling': return 'Statistically draws random SKU sets for safety check.'
      case 'Event-Triggered': return 'Triggered by discrepancies, damage, or audit variance alerts.'
      case 'Full Physical Inventory': return 'Annual/Semi-annual complete warehouse physical count.'
      default: return ''
    }
  }

  const getScopeLabel = () => {
    switch (strategy) {
      case 'ABC-Based': return abcClass
      case 'Zone-Based': return zonePick
      case 'Random Sampling': return `Random Sampling (${sampleSize})`
      case 'Event-Triggered': return `Event: ${eventNote}`
      case 'Full Physical Inventory': return 'Full Facility Inventory'
      default: return 'General'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduledDate || !assignedTo) {
      alert('Please fill out all required fields.')
      return
    }

    onAdd({
      countNumber: `CC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      strategy,
      scopeLabel: getScopeLabel(),
      warehouseId,
      scheduledDate,
      assignedTo,
      isBlindCount,
      status: 'Scheduled',
      items: [
        { skuId: '1', bin: 'Zone A · Bin A-01-05', systemQty: 450 },
        { skuId: '6', bin: 'Zone B · Bin B-03-05', systemQty: 800 }
      ]
    })

    // Reset Form
    setStrategy('ABC-Based')
    setScheduledDate('')
    setAssignedTo('')
    setIsBlindCount(true)
    setAbcClass('Class A SKUs')
    setZonePick('Zone A')
    setSampleSize('20 SKUs')
    setEventNote('Spill event audit')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Count Audit Plan">
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse Facility *</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className={styles.select}
            >
              {mockWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Scheduled Audit Date *</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Counting Strategy *</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className={styles.select}
          >
            <option value="ABC-Based">ABC-Based Cycle Count</option>
            <option value="Zone-Based">Zone-Based Audit</option>
            <option value="Random Sampling">Random Sampling</option>
            <option value="Event-Triggered">Event-Triggered Audit</option>
            <option value="Full Physical Inventory">Full Physical Inventory (Wall-to-Wall)</option>
          </select>
          <span className={styles.helpText}>{getStrategyDescription(strategy)}</span>
        </div>

        {/* Dynamic scope selector */}
        {strategy === 'ABC-Based' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Target ABC Classification *</label>
            <select
              value={abcClass}
              onChange={(e) => setAbcClass(e.target.value as any)}
              className={styles.select}
            >
              <option value="Class A SKUs">Class A SKUs (High Velocity)</option>
              <option value="Class B SKUs">Class B SKUs (Medium Velocity)</option>
              <option value="Class C SKUs">Class C SKUs (Low Velocity)</option>
            </select>
          </div>
        )}

        {strategy === 'Zone-Based' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse Zone *</label>
            <select
              value={zonePick}
              onChange={(e) => setZonePick(e.target.value)}
              className={styles.select}
            >
              <option value="Zone A">Zone A (Active Picker Racks)</option>
              <option value="Zone B">Zone B (Heavy Bulk Storage)</option>
              <option value="Zone C">Zone C (Cold Storage Vaults)</option>
            </select>
          </div>
        )}

        {strategy === 'Random Sampling' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Sample Size Count *</label>
            <input
              type="text"
              value={sampleSize}
              onChange={(e) => setSampleSize(e.target.value)}
              placeholder="e.g. 20 SKUs / 5% of stock"
              required
              className={styles.input}
            />
          </div>
        )}

        {strategy === 'Event-Triggered' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Event Reason Note *</label>
            <input
              type="text"
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
              placeholder="e.g. Discrepancy logged on SKU #1"
              required
              className={styles.input}
            />
          </div>
        )}

        {/* Full Physical Inventory WARNING */}
        {strategy === 'Full Physical Inventory' && (
          <div className={styles.warningBox}>
            <AlertTriangle size={18} className={styles.warnIcon} />
            <div>
              <strong>Transaction Freezing Warning</strong>
              <p>Warning: Selecting Full Physical Inventory will pause stock inbound/outbound dispatches for the duration of this count.</p>
            </div>
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Assigned Counter (Auditor) *</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Counter name"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={isBlindCount}
                onChange={(e) => setIsBlindCount(e.target.checked)}
                className={styles.checkbox}
              />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Enable Blind Count</span>
            </label>
            <span className={styles.toggleHelp}>Hides expected quantities from counter to prevent bias.</span>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Publish Count Plan
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default CreateCountPlanModal
