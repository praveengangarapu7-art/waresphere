import React, { useState } from 'react'
import { InboundOrder } from '../../../../types/inboundOrder'
import { mockWarehouses } from '../../../../mock-data/warehouses'
import { Table } from '../../../../components/ui/Table/Table'
import styles from './Steps.module.css'

interface AsnDetailsStepProps {
  order: InboundOrder
  onChange: (order: InboundOrder) => void
}

export const AsnDetailsStep: React.FC<AsnDetailsStepProps> = ({
  order,
  onChange
}) => {
  const isWalkIn = !order.asnNumber // If no ASN, it is a standalone walk-in GRN

  const handleWalkInChange = (field: keyof InboundOrder, value: any) => {
    onChange({
      ...order,
      [field]: value
    })
  }

  const getWarehouseName = (id: string) => {
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 1: Inbound Metadata & Line Items</h3>
      
      {isWalkIn ? (
        // Walk-in GRN Form
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Supplier Name *</label>
            <input
              type="text"
              value={order.supplierName}
              onChange={(e) => handleWalkInChange('supplierName', e.target.value)}
              placeholder="e.g. Cipla Ltd."
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>PO Reference</label>
            <input
              type="text"
              value={order.poReference || ''}
              onChange={(e) => handleWalkInChange('poReference', e.target.value)}
              placeholder="PO-XXXX"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Receiving Warehouse *</label>
            <select
              value={order.warehouseId}
              onChange={(e) => handleWalkInChange('warehouseId', e.target.value)}
              className={styles.select}
            >
              {mockWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Expected Date *</label>
            <input
              type="date"
              value={order.expectedDate}
              onChange={(e) => handleWalkInChange('expectedDate', e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>
      ) : (
        // Read-only ASN Details
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>Supplier</span>
            <strong>{order.supplierName}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>PO Reference</span>
            <strong>{order.poReference || '—'}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>Destination Facility</span>
            <strong>{getWarehouseName(order.warehouseId)}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.sumLabel}>Expected Date</span>
            <strong>{order.expectedDate}</strong>
          </div>
        </div>
      )}

      {/* Expected Line Items List */}
      <div className={styles.tableSection}>
        <h4 className={styles.sectionTitle}>Manifested Line Items</h4>
        <Table headers={['SKU Identification', 'Expected Quantity']}>
          {order.lineItems.map((item, i) => (
            <tr key={i}>
              <td>
                <strong>SKU #{item.skuId}</strong>
                <span className={styles.itemHelper}>Standard packaging units</span>
              </td>
              <td><strong>{item.expectedQty.toLocaleString('en-IN')} units</strong></td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
export default AsnDetailsStep
