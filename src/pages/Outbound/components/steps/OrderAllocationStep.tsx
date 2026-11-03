import React, { useState } from 'react'
import { OutboundOrder } from '../../../../types/outboundOrder'
import { Table } from '../../../../components/ui/Table/Table'
import { Inbox, CheckCircle, AlertTriangle } from 'lucide-react'
import styles from './Steps.module.css'

interface OrderAllocationStepProps {
  order: OutboundOrder
  onChange: (order: OutboundOrder) => void
}

export const OrderAllocationStep: React.FC<OrderAllocationStepProps> = ({
  order,
  onChange
}) => {
  const [allocationDone, setAllocationDone] = useState(order.status !== 'Pending')

  // Check mock availability: pretend SKU 2 has a shortfall if orderedQty > 300 to show the shortfall warn path
  const checkStockShortfall = (skuId: string, qty: number) => {
    return skuId === '2' && qty > 300
  }

  const handleAllocate = () => {
    setAllocationDone(true)
    onChange({
      ...order,
      status: 'Allocated'
    })
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 1: Order Meta & Stock Allocation</h3>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Customer / Consignee</span>
          <strong>{order.customerName}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Destination State</span>
          <strong>{order.consigneeState}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>GSTIN Reference</span>
          <strong>{order.consigneeGstin || 'URD (Unregistered)'}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}>Required Delivery</span>
          <strong>{order.requiredDispatchDate}</strong>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.headerWithAction}>
          <h4 className={styles.sectionTitle}>Required Line Items</h4>
          {!allocationDone ? (
            <button
              type="button"
              onClick={handleAllocate}
              className={styles.btnAllocate}
            >
              <Inbox size={14} />
              <span>Allocate Inventory</span>
            </button>
          ) : (
            <span className={styles.successBadge}>
              <CheckCircle size={12} />
              <span>Stock Allocated</span>
            </span>
          )}
        </div>

        <Table headers={['SKU Identification', 'Ordered Quantity', 'Status Allocation']}>
          {order.lineItems.map((item, idx) => {
            const hasShortfall = checkStockShortfall(item.skuId, item.orderedQty)

            return (
              <tr key={idx} className={hasShortfall ? styles.rowWarning : ''}>
                <td>
                  <strong>SKU #{item.skuId}</strong>
                </td>
                <td><strong>{item.orderedQty.toLocaleString('en-IN')} units</strong></td>
                <td>
                  {allocationDone ? (
                    hasShortfall ? (
                      <div className={styles.shortfallCell}>
                        <AlertTriangle size={12} className={styles.warnIcon} />
                        <span>Shortfall Flagged</span>
                      </div>
                    ) : (
                      <span className={styles.allocatedText}>Stock Reserved</span>
                    )
                  ) : (
                    <span className={styles.pendingText}>Awaiting Allocation</span>
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
export default OrderAllocationStep
