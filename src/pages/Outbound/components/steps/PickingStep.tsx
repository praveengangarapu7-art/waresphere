import React, { useState } from 'react'
import { OutboundOrder, OutboundLineItem } from '../../../../types/outboundOrder'
import { Table } from '../../../../components/ui/Table/Table'
import { Scan, MapPin } from 'lucide-react'
import styles from './Steps.module.css'

interface PickingStepProps {
  order: OutboundOrder
  onChange: (order: OutboundOrder) => void
}

export const PickingStep: React.FC<PickingStepProps> = ({
  order,
  onChange
}) => {
  const [scanFlash, setScanFlash] = useState<Record<string, boolean>>({})

  const handleStrategyChange = (val: OutboundOrder['pickingStrategy']) => {
    onChange({
      ...order,
      pickingStrategy: val
    })
  }

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

  const handleScanPick = (index: number) => {
    const item = order.lineItems[index]
    const current = item.pickedQty || 0
    const next = Math.min(item.orderedQty, current + 100) // Increment by 100

    setScanFlash(prev => ({ ...prev, [item.skuId]: true }))
    setTimeout(() => {
      setScanFlash(prev => ({ ...prev, [item.skuId]: false }))
    }, 400)

    const binCode = item.pickBin || `Zone B · Rack 0${index + 1} · Bin B-0${index + 1}-08`
    handleLineChange(index, 'pickedQty', next)
    handleLineChange(index, 'pickBin', binCode)
  }

  const strategyDescriptions = {
    'Single Order': 'Picker receives a single order slip and picks all line items in one trip.',
    Wave: 'Orders are grouped by delivery zones or transport schedules to optimize loading docks.',
    Batch: 'Picker aggregates items across multiple orders to harvest SKUs in a single route.'
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 2: Picking Strategy & Bin Harvesting</h3>

      {/* Picking Strategy selector */}
      <div className={styles.strategyBox}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Select Picking Route Strategy *</label>
          <select
            value={order.pickingStrategy || 'Single Order'}
            onChange={(e) => handleStrategyChange(e.target.value as any)}
            className={styles.select}
          >
            <option value="Single Order">Single Order Picking</option>
            <option value="Wave">Wave Picking</option>
            <option value="Batch">Batch Picking</option>
          </select>
        </div>
        <p className={styles.strategyDesc}>
          {strategyDescriptions[order.pickingStrategy || 'Single Order']}
        </p>
      </div>

      {/* Picking List table */}
      <div className={styles.tableSection}>
        <h4 className={styles.sectionTitle}>Pick List Manifest</h4>
        <Table headers={['SKU Identification', 'Target Qty', 'Picked Qty', 'Suggested Location', 'Action']}>
          {order.lineItems.map((item, index) => {
            const isFinished = item.pickedQty === item.orderedQty
            const suggestedBin = item.pickBin || `Zone B · Rack 0${index + 1} · Bin B-0${index + 1}-08`
            const isFlashing = scanFlash[item.skuId]

            return (
              <tr key={index} className={isFinished ? styles.rowSuccess : ''}>
                <td><strong>SKU #{item.skuId}</strong></td>
                <td>{item.orderedQty.toLocaleString('en-IN')} units</td>
                <td>
                  <div className={styles.scanCell}>
                    <input
                      type="number"
                      value={item.pickedQty !== undefined ? item.pickedQty : ''}
                      onChange={(e) => handleLineChange(index, 'pickedQty', Number(e.target.value))}
                      placeholder="Picked"
                      className={`${styles.qtyInput} ${isFlashing ? styles.flashInput : ''}`}
                    />
                  </div>
                </td>
                <td>
                  <div className={styles.suggestedBinCell}>
                    <MapPin size={12} className={styles.pinIcon} />
                    <span>{suggestedBin}</span>
                  </div>
                </td>
                <td>
                  {isFinished ? (
                    <span className={styles.successText}>Harvested</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScanPick(index)}
                      className={styles.btnScan}
                      title="Simulate Barcode Pick Scan"
                    >
                      <Scan size={12} />
                      <span>Scan Pick</span>
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
export default PickingStep
