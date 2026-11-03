import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { InboundOrder } from '../../../types/inboundOrder'
import { Plus, Trash } from 'lucide-react'
import styles from './CreateAsnModal.module.css'

interface CreateAsnModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (order: Omit<InboundOrder, 'id'>) => void
}

export const CreateAsnModal: React.FC<CreateAsnModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [supplierName, setSupplierName] = useState('')
  const [poReference, setPoReference] = useState('')
  const [warehouseId, setWarehouseId] = useState(mockWarehouses[0]?.id || '')
  const [source, setSource] = useState<InboundOrder['source']>('Supplier Delivery')
  const [expectedDate, setExpectedDate] = useState('')
  const [lineItems, setLineItems] = useState<Array<{ skuId: string; expectedQty: number }>>([
    { skuId: '1', expectedQty: 100 }
  ])

  const handleAddLine = () => {
    setLineItems(prev => [...prev, { skuId: String(prev.length + 1), expectedQty: 100 }])
  }

  const handleRemoveLine = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleLineChange = (idx: number, key: 'skuId' | 'expectedQty', value: any) => {
    const updated = [...lineItems]
    updated[idx] = {
      ...updated[idx],
      [key]: value
    }
    setLineItems(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierName || !expectedDate || lineItems.length === 0) {
      alert('Please fill out all required fields.')
      return
    }

    onAdd({
      asnNumber: `ASN-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      supplierName,
      poReference,
      warehouseId,
      source,
      expectedDate,
      status: 'Pending ASN',
      crossDock: false,
      lineItems: lineItems.map(item => ({
        skuId: item.skuId,
        expectedQty: Number(item.expectedQty)
      }))
    })

    // Reset Form
    setSupplierName('')
    setPoReference('')
    setWarehouseId(mockWarehouses[0]?.id || '')
    setSource('Supplier Delivery')
    setExpectedDate('')
    setLineItems([{ skuId: '1', expectedQty: 100 }])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Advance Shipment Notice (ASN)">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Supplier / Dispatching Party *</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Cipla Ltd."
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>PO Reference</label>
            <input
              type="text"
              value={poReference}
              onChange={(e) => setPoReference(e.target.value)}
              placeholder="PO-XXXX"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Receiving Warehouse *</label>
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
            <label className={styles.label}>Inbound Channel / Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className={styles.select}
            >
              <option value="Supplier Delivery">Supplier Delivery</option>
              <option value="Inter-warehouse Transfer">Inter-warehouse Transfer</option>
              <option value="Customer Return">Customer Return</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Expected Delivery Date *</label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        {/* Dynamic Line items addition */}
        <div className={styles.lineItemsSection}>
          <div className={styles.lineHeader}>
            <h4 className={styles.sectionTitle}>Expected Line Items *</h4>
            <button
              type="button"
              onClick={handleAddLine}
              className={styles.btnAddLine}
            >
              <Plus size={12} />
              <span>Add SKU</span>
            </button>
          </div>

          <div className={styles.linesList}>
            {lineItems.map((item, idx) => (
              <div key={idx} className={styles.lineRow}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <select
                    value={item.skuId}
                    onChange={(e) => handleLineChange(idx, 'skuId', e.target.value)}
                    className={styles.select}
                  >
                    <option value="1">SKU #1 (Amoxicillin)</option>
                    <option value="2">SKU #2 (Paracetamol)</option>
                    <option value="6">SKU #6 (Basmati Rice)</option>
                    <option value="11">SKU #11 (Sodium Hypo)</option>
                    <option value="21">SKU #21 (Brake Pad)</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={item.expectedQty}
                    onChange={(e) => handleLineChange(idx, 'expectedQty', Number(e.target.value))}
                    min={1}
                    required
                    className={styles.input}
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className={styles.btnRemove}
                    title="Remove item"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Publish Inbound ASN
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default CreateAsnModal
