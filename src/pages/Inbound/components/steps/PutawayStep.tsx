import React from 'react'
import { InboundOrder } from '../../../../types/inboundOrder'
import { Table } from '../../../../components/ui/Table/Table'
import { MapPin, CheckCircle } from 'lucide-react'
import styles from './Steps.module.css'

interface PutawayStepProps {
  order: InboundOrder
  onChange: (order: InboundOrder) => void
}

export const PutawayStep: React.FC<PutawayStepProps> = ({
  order,
  onChange
}) => {
  // Filter only accepted line items for putaway
  const acceptedItems = order.lineItems.filter(item => item.qualityStatus === 'Accepted')

  const handleBinChange = (index: number, value: string) => {
    // Find absolute index of item in complete list
    const absoluteIndex = order.lineItems.findIndex(item => item.skuId === acceptedItems[index].skuId)
    if (absoluteIndex !== -1) {
      const updatedLineItems = [...order.lineItems]
      updatedLineItems[absoluteIndex] = {
        ...updatedLineItems[absoluteIndex],
        putawayBin: value
      }
      onChange({
        ...order,
        lineItems: updatedLineItems
      })
    }
  }

  const handleConfirmPutaway = (index: number) => {
    const binCode = acceptedItems[index].putawayBin || `Zone B · Rack 0${index + 1} · Bin B-0${index + 1}-05`
    handleBinChange(index, `${binCode} (Confirmed)`)
  }

  const handleConfirmAll = () => {
    const updatedLineItems = order.lineItems.map((item, idx) => {
      if (item.qualityStatus === 'Accepted' && !item.putawayBin?.includes('Confirmed')) {
        const binCode = item.putawayBin || `Zone B · Rack 0${idx + 1} · Bin B-0${idx + 1}-05`
        return {
          ...item,
          putawayBin: `${binCode} (Confirmed)`
        }
      }
      return item
    })

    onChange({
      ...order,
      lineItems: updatedLineItems
    })
  }

  const mockBinsList = [
    'Zone A · Rack 01 · Bin A-01-05',
    'Zone B · Rack 04 · Bin B-04-12',
    'Zone C · Rack 02 · Bin C-02-08',
    'Zone D · Rack 05 · Bin D-05-15'
  ]

  if (acceptedItems.length === 0) {
    return (
      <div className={styles.empty}>
        No accepted line items available for putaway. Check quality clearance statuses.
      </div>
    )
  }

  return (
    <div className={styles.stepContainer}>
      <div className={styles.headerWithAction}>
        <h3 className={styles.stepTitle}>Step 4: Smart Storage Bins & Putaway</h3>
        <button
          type="button"
          onClick={handleConfirmAll}
          className={styles.btnBulkConfirm}
        >
          <CheckCircle size={14} />
          <span>Confirm All Putaways</span>
        </button>
      </div>

      <Table headers={['SKU Code', 'Cleared Qty', 'AI Suggested Storage Bin', 'Override Destination Bin', 'Action']}>
        {acceptedItems.map((item, index) => {
          const isConfirmed = item.putawayBin?.includes('Confirmed')
          const suggestedBin = `Zone B · Rack 0${index + 1} · Bin B-0${index + 1}-05`

          return (
            <tr key={index}>
              <td><strong>SKU #{item.skuId}</strong></td>
              <td>{(item.receivedQty || item.expectedQty).toLocaleString('en-IN')} units</td>
              <td>
                <div className={styles.suggestedBinCell}>
                  <MapPin size={12} className={styles.pinIcon} />
                  <span>{suggestedBin}</span>
                </div>
              </td>
              <td>
                <select
                  value={item.putawayBin?.replace(' (Confirmed)', '') || suggestedBin}
                  onChange={(e) => handleBinChange(index, e.target.value)}
                  disabled={isConfirmed}
                  className={styles.tableSelect}
                >
                  <option value={suggestedBin}>{suggestedBin} (Suggested)</option>
                  {mockBinsList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </td>
              <td>
                {isConfirmed ? (
                  <span className={styles.successText}>Confirmed</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmPutaway(index)}
                    className={styles.btnRowAction}
                  >
                    Confirm Putaway
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  )
}
export default PutawayStep
