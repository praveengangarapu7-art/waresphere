import React, { useState, useEffect } from 'react'
import { Modal } from '../../../../components/ui/Modal/Modal'
import { mockWarehouses } from '../../../../mock-data/warehouses'
import { StockMovement } from '../../../../types/movement'
import styles from './CreateMovementModal.module.css'

interface CreateMovementModalProps {
  isOpen: boolean
  onClose: () => void
  type: string
  onAdd: (movement: Omit<StockMovement, 'id'>) => void
}

export const CreateMovementModal: React.FC<CreateMovementModalProps> = ({
  isOpen,
  onClose,
  type,
  onAdd
}) => {
  const [fromWarehouse, setFromWarehouse] = useState(mockWarehouses[0]?.id || '')
  const [toWarehouse, setToWarehouse] = useState(mockWarehouses[1]?.id || '')
  const [fromBin, setFromBin] = useState('')
  const [toBin, setToBin] = useState('')
  const [skuId, setSkuId] = useState('1')
  const [qty, setQty] = useState<number>(100)
  const [reason, setReason] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [valueImpact, setValueImpact] = useState<number>(5000)

  // Reset fields on open
  useEffect(() => {
    if (isOpen) {
      setReason('')
      setCounterparty('')
      setQty(100)
      setValueImpact(5000)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const isTransfer = type === 'Inter-Warehouse Transfer'
    const isBinMove = type === 'Bin-to-Bin Move'
    const isAdjustment = type === 'Stock Adjustment'
    const isReturn = type.includes('Return')
    const isKit = type.includes('Kit')

    onAdd({
      movementNumber: `${type.substring(0, 2).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: type as any,
      status: isTransfer || isAdjustment ? 'Pending Approval' : 'Completed',
      fromWarehouseId: fromWarehouse,
      toWarehouseId: isTransfer ? toWarehouse : undefined,
      fromBin: isBinMove ? fromBin : undefined,
      toBin: isBinMove ? toBin : undefined,
      lineItems: [
        {
          skuId,
          quantity: isAdjustment ? -qty : qty,
          batchNumber: isReturn ? 'BAT-RMA-992' : 'BAT-GEN-002'
        }
      ],
      reasonCode: reason,
      counterpartyName: isReturn ? counterparty : undefined,
      valueImpact: isAdjustment || isReturn ? valueImpact : undefined,
      requestedBy: 'Ranjit Singh',
      requestedAt: new Date().toISOString().split('T')[0] + ' 12:00'
    })

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Register ${type}`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Origin Warehouse Selector */}
        {type !== 'Customer Return (RMA)' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse Facility *</label>
            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className={styles.select}
            >
              {mockWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Counterparty for Returns */}
        {type.includes('Return') && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Counterparty Name (Customer/Supplier) *</label>
            <input
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="e.g. Apollo Hospitals / Cipla Ltd."
              required
              className={styles.input}
            />
          </div>
        )}

        {/* Inter-Warehouse target */}
        {type === 'Inter-Warehouse Transfer' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Destination Facility *</label>
            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className={styles.select}
            >
              {mockWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Bin relocators */}
        {type === 'Bin-to-Bin Move' && (
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Source Bin location *</label>
              <input
                type="text"
                value={fromBin}
                onChange={(e) => setFromBin(e.target.value)}
                placeholder="e.g. Zone A · Bin B-01-05"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Target Bin location *</label>
              <input
                type="text"
                value={toBin}
                onChange={(e) => setToBin(e.target.value)}
                placeholder="e.g. Zone B · Bin B-01-12"
                required
                className={styles.input}
              />
            </div>
          </div>
        )}

        {/* SKU Selector */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Select SKU *</label>
            <select
              value={skuId}
              onChange={(e) => setSkuId(e.target.value)}
              className={styles.select}
            >
              <option value="1">SKU #1 (Amoxicillin)</option>
              <option value="2">SKU #2 (Paracetamol)</option>
              <option value="6">SKU #6 (Basmati Rice)</option>
              <option value="11">SKU #11 (Sodium Hypo)</option>
              <option value="21">SKU #21 (Brake Pad)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Quantity Delta *</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              min={1}
              required
              className={styles.input}
            />
          </div>
        </div>

        {/* Value impact for audits */}
        {(type === 'Stock Adjustment' || type.includes('Return')) && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Estimated Value Impact (₹) *</label>
            <input
              type="number"
              value={valueImpact}
              onChange={(e) => setValueImpact(Number(e.target.value))}
              min={1}
              required
              className={styles.input}
            />
          </div>
        )}

        {/* Reason Code */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Reason Code / Comments *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Counting Variance / Re-slotting"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Publish Movement
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default CreateMovementModal
