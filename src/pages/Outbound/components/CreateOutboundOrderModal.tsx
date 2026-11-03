import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { OutboundOrder } from '../../../types/outboundOrder'
import { Plus, Trash } from 'lucide-react'
import styles from './CreateOutboundOrderModal.module.css'

interface CreateOutboundOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (order: Omit<OutboundOrder, 'id'>) => void
}

export const CreateOutboundOrderModal: React.FC<CreateOutboundOrderModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [customerName, setCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('Maharashtra')
  const [gstin, setGstin] = useState('')
  const [warehouseId, setWarehouseId] = useState(mockWarehouses[0]?.id || '')
  const [orderType, setOrderType] = useState<OutboundOrder['orderType']>('Sales Order')
  const [requiredDate, setRequiredDate] = useState('')
  
  const [lineItems, setLineItems] = useState<Array<{ skuId: string; orderedQty: number }>>([
    { skuId: '1', orderedQty: 100 }
  ])

  const handleAddLine = () => {
    setLineItems(prev => [...prev, { skuId: String(prev.length + 1), orderedQty: 100 }])
  }

  const handleRemoveLine = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleLineChange = (idx: number, key: 'skuId' | 'orderedQty', value: any) => {
    const updated = [...lineItems]
    updated[idx] = {
      ...updated[idx],
      [key]: value
    }
    setLineItems(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !address || !requiredDate || lineItems.length === 0) {
      alert('Please fill out all required fields.')
      return
    }

    // Rough check on GSTIN format if provided
    if (gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (!gstinRegex.test(gstin.toUpperCase())) {
        alert('Invalid GSTIN format. Expected format (e.g. 27AABCW1842A1Z5)')
        return
      }
    }

    // Determine mock value based on quantity
    const totalQty = lineItems.reduce((acc, i) => acc + i.orderedQty, 0)
    const mockValue = totalQty * 125 // average unit rate ₹125

    onAdd({
      orderNumber: `SO-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      orderType,
      customerName,
      consigneeAddress: address,
      consigneeState: state,
      consigneeGstin: gstin.toUpperCase() || undefined,
      warehouseId,
      orderDate: new Date().toISOString().split('T')[0],
      requiredDispatchDate: requiredDate,
      invoiceValue: mockValue,
      status: 'Pending',
      lineItems: lineItems.map(item => ({
        skuId: item.skuId,
        orderedQty: Number(item.orderedQty)
      }))
    })

    // Reset Form
    setCustomerName('')
    setAddress('')
    setState('Maharashtra')
    setGstin('')
    setWarehouseId(mockWarehouses[0]?.id || '')
    setOrderType('Sales Order')
    setRequiredDate('')
    setLineItems([{ skuId: '1', orderedQty: 100 }])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Outbound Dispatch Order">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Consignee / Customer Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Apollo Hospitals"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Order Classification</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className={styles.select}
            >
              <option value="Sales Order">Sales Order</option>
              <option value="Material Request">Material Request (Stock Transfer)</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Consignee Street Address *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Jubilee Hills, Hyderabad"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Destination State *</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={styles.select}
            >
              {['Maharashtra', 'Tamil Nadu', 'Telangana', 'Karnataka', 'Haryana', 'Gujarat', 'Delhi'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Consignee GSTIN</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="15-digit GSTIN ID"
              maxLength={15}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Origin Dispatch Facility *</label>
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
            <label className={styles.label}>Required Delivery Date *</label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>
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
                    value={item.orderedQty}
                    onChange={(e) => handleLineChange(idx, 'orderedQty', Number(e.target.value))}
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
            Publish Outbound Order
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default CreateOutboundOrderModal
