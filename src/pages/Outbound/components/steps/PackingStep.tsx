import React, { useState } from 'react'
import { OutboundOrder, OutboundLineItem } from '../../../../types/outboundOrder'
import { Table } from '../../../../components/ui/Table/Table'
import { Scan, Box, AlertOctagon } from 'lucide-react'
import styles from './Steps.module.css'

interface PackingStepProps {
  order: OutboundOrder
  onChange: (order: OutboundOrder) => void
}

export const PackingStep: React.FC<PackingStepProps> = ({
  order,
  onChange
}) => {
  const [scanFlash, setScanFlash] = useState<Record<string, boolean>>({})
  const [packageCount, setPackageCount] = useState<number>(1)
  const [packageWeight, setPackageWeight] = useState<number>(Math.round(order.invoiceValue / 1000))

  const handleLineChange = (index: number, key: keyof OutboundLineItem, value: any) => {
    const updatedLineItems = [...order.lineItems]
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [key]: value
    }
    onChange({
      ...order,
      lineItems: updatedLineItems
    })
  }

  const handleScanPack = (index: number) => {
    const item = order.lineItems[index]
    const current = item.packedQty || 0
    const next = Math.min(item.pickedQty || item.orderedQty, current + 100) // Increment by 100

    setScanFlash(prev => ({ ...prev, [item.skuId]: true }))
    setTimeout(() => {
      setScanFlash(prev => ({ ...prev, [item.skuId]: false }))
    }, 400)

    handleLineChange(index, 'packedQty', next)
  }

  // Check if there is any mismatch between picked and packed quantities
  const hasMismatch = order.lineItems.some(
    item => (item.pickedQty || item.orderedQty) !== (item.packedQty || 0)
  )

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 3: Packing Checklist & Weighing Validation</h3>

      {/* Package Specs */}
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Consignee Carton / Pack Count *</label>
          <input
            type="number"
            value={packageCount}
            onChange={(e) => setPackageCount(Number(e.target.value))}
            min={1}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Consolidated Gross Weight (kg) *</label>
          <input
            type="number"
            value={packageWeight}
            onChange={(e) => setPackageWeight(Number(e.target.value))}
            min={1}
            required
            className={styles.input}
          />
        </div>
      </div>

      {/* Checklist Table */}
      <div className={styles.tableSection}>
        <h4 className={styles.sectionTitle}>Verification Checklist</h4>
        <Table headers={['SKU Identification', 'Picked Qty', 'Packed Verification Qty', 'Action']}>
          {order.lineItems.map((item, index) => {
            const picked = item.pickedQty || item.orderedQty
            const packed = item.packedQty || 0
            const isMatched = picked === packed
            const isFlashing = scanFlash[item.skuId]

            return (
              <tr key={index} className={isMatched ? styles.rowSuccess : styles.rowDanger}>
                <td><strong>SKU #{item.skuId}</strong></td>
                <td>{picked.toLocaleString('en-IN')} units</td>
                <td>
                  <div className={styles.scanCell}>
                    <input
                      type="number"
                      value={item.packedQty !== undefined ? item.packedQty : ''}
                      onChange={(e) => handleLineChange(index, 'packedQty', Number(e.target.value))}
                      placeholder="Packed"
                      className={`${styles.qtyInput} ${isFlashing ? styles.flashInput : ''}`}
                    />
                  </div>
                </td>
                <td>
                  {isMatched ? (
                    <span className={styles.successText}>Verified</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScanPack(index)}
                      className={styles.btnScan}
                      title="Simulate Barcode Pack Scan"
                    >
                      <Scan size={12} />
                      <span>Scan Pack</span>
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      </div>

      {hasMismatch && (
        <div className={styles.dangerRow}>
          <AlertOctagon size={16} />
          <span>Quantity Mismatch Detected! Pack verification must match picked totals before cargo gate releases.</span>
        </div>
      )}
    </div>
  )
}
export default PackingStep
