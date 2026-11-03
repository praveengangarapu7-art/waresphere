import React, { useState } from 'react'
import { InboundOrder, InboundLineItem } from '../../../../types/inboundOrder'
import { Table } from '../../../../components/ui/Table/Table'
import { Scan, Camera, Check, AlertTriangle } from 'lucide-react'
import styles from './Steps.module.css'

interface QualityInspectionStepProps {
  order: InboundOrder
  onChange: (order: InboundOrder) => void
}

export const QualityInspectionStep: React.FC<QualityInspectionStepProps> = ({
  order,
  onChange
}) => {
  // Local state for scan highlight animations
  const [scanFlash, setScanFlash] = useState<Record<string, boolean>>({})

  const handleLineItemChange = (index: number, key: keyof InboundLineItem, value: any) => {
    const updatedLineItems = [...order.lineItems]
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [key]: value
    }
    
    // Automatically match quality to Hold/Rejected if a reason is picked
    if (key === 'rejectReason' && value !== '') {
      // Keep previous rejected or hold status
    }

    onChange({
      ...order,
      lineItems: updatedLineItems
    })
  }

  // Barcode Scan Simulation
  const handleScanItem = (index: number) => {
    const item = order.lineItems[index]
    const currentReceived = item.receivedQty || 0
    const nextReceived = Math.min(item.expectedQty, currentReceived + 100) // Increment by 100 units

    // Trigger flash animation
    const skuId = item.skuId
    setScanFlash(prev => ({ ...prev, [skuId]: true }))
    setTimeout(() => {
      setScanFlash(prev => ({ ...prev, [skuId]: false }))
    }, 400)

    handleLineItemChange(index, 'receivedQty', nextReceived)
  }

  const handleCapturePhoto = (index: number) => {
    handleLineItemChange(index, 'photoCaptured', true)
  }

  const rejectReasons = [
    'Damaged Packaging',
    'Temperature Excursion',
    'Documentation Mismatch',
    'Quantity Shortfall',
    'Quality Sample Failed'
  ]

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 3: Cargo Receipt & Quality Verification</h3>

      <Table headers={['SKU Code', 'Expected Qty', 'Received Qty', 'Quality Status', 'Reason Code', 'Cargo Photo']}>
        {order.lineItems.map((item, index) => {
          const isQtyMismatch = item.receivedQty !== undefined && item.receivedQty !== item.expectedQty
          const isFlashing = scanFlash[item.skuId]

          return (
            <tr key={index} className={`${styles.itemRow} ${isQtyMismatch ? styles.rowWarning : ''}`}>
              <td>
                <strong>SKU #{item.skuId}</strong>
              </td>
              <td>{item.expectedQty.toLocaleString('en-IN')} units</td>
              <td>
                <div className={styles.scanCell}>
                  <input
                    type="number"
                    value={item.receivedQty !== undefined ? item.receivedQty : ''}
                    onChange={(e) => handleLineItemChange(index, 'receivedQty', Number(e.target.value))}
                    placeholder="Received"
                    className={`${styles.qtyInput} ${isFlashing ? styles.flashInput : ''}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleScanItem(index)}
                    className={styles.btnScan}
                    title="Simulate Barcode Scan"
                  >
                    <Scan size={12} />
                  </button>
                </div>
              </td>
              <td>
                <select
                  value={item.qualityStatus || 'Accepted'}
                  onChange={(e) => handleLineItemChange(index, 'qualityStatus', e.target.value)}
                  className={styles.tableSelect}
                >
                  <option value="Accepted">Accepted</option>
                  <option value="Hold">Hold</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td>
                {item.qualityStatus && item.qualityStatus !== 'Accepted' ? (
                  <select
                    value={item.rejectReason || ''}
                    onChange={(e) => handleLineItemChange(index, 'rejectReason', e.target.value)}
                    required
                    className={styles.tableSelect}
                  >
                    <option value="">Select Reason...</option>
                    {rejectReasons.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <span className={styles.naText}>N/A (Clear)</span>
                )}
              </td>
              <td>
                <div className={styles.photoCell}>
                  {item.photoCaptured ? (
                    <div className={styles.photoThumbnail} title="Cargo photo verified">
                      <Check size={12} className={styles.photoIconCheck} />
                      <span>Captured</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCapturePhoto(index)}
                      className={styles.btnPhoto}
                    >
                      <Camera size={12} />
                      <span>Photo</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      
      <div className={styles.stepHelperRow}>
        <AlertTriangle size={14} className={styles.warnIcon} />
        <span>Mismatched quantities or warning flags are highlighted in amber. Commit photo logs as quality audit evidence.</span>
      </div>
    </div>
  )
}
export default QualityInspectionStep
