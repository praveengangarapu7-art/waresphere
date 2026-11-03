import React from 'react'
import { InboundOrder } from '../../../../types/inboundOrder'
import { CheckSquare, AlertCircle, RefreshCw } from 'lucide-react'
import styles from './Steps.module.css'

interface CompleteStepProps {
  order: InboundOrder
  onComplete: () => void
}

export const CompleteStep: React.FC<CompleteStepProps> = ({
  order,
  onComplete
}) => {
  const totalExpected = order.lineItems.reduce((acc, item) => acc + item.expectedQty, 0)
  const totalReceived = order.lineItems.reduce((acc, item) => acc + (item.receivedQty || 0), 0)

  const rejectedItems = order.lineItems.filter(item => item.qualityStatus === 'Rejected' || item.qualityStatus === 'Hold')

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 5: Operational Sign-Off</h3>

      <div className={styles.completeGrid}>
        {/* Cargo Summary */}
        <div className={styles.summaryBox}>
          <h4>Receiving Audit Summary</h4>
          <div className={styles.summaryMetaRow}>
            <span>Expected Manifest Units:</span>
            <strong>{totalExpected.toLocaleString('en-IN')} units</strong>
          </div>
          <div className={styles.summaryMetaRow}>
            <span>Physically Audited Units:</span>
            <strong className={totalExpected !== totalReceived ? styles.warnText : styles.successText}>
              {totalReceived.toLocaleString('en-IN')} units
            </strong>
          </div>
        </div>

        {/* Quality Exceptions Warnings */}
        {rejectedItems.length > 0 && (
          <div className={styles.exceptionBox}>
            <div className={styles.exceptionHeader}>
              <AlertCircle size={16} className={styles.alertIcon} />
              <h4>Quality Exceptions Flagged ({rejectedItems.length})</h4>
            </div>
            <ul className={styles.exceptionList}>
              {rejectedItems.map((item, i) => (
                <li key={i}>
                  SKU #{item.skuId} — <Badge variant={item.qualityStatus === 'Rejected' ? 'danger' : 'warning'}>{item.qualityStatus}</Badge>{' '}
                  {item.rejectReason ? `(${item.rejectReason})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.actionBlock}>
        <button
          type="button"
          onClick={onComplete}
          className={styles.btnFinalComplete}
        >
          <CheckSquare size={16} />
          <span>Mark Receiving Complete</span>
        </button>
      </div>
    </div>
  )
}

// Inline Badge component for local simplicity
const Badge: React.FC<{ children: React.ReactNode; variant: 'warning' | 'danger' }> = ({ children, variant }) => {
  const variantClass = variant === 'danger' ? styles.badgeDanger : styles.badgeWarning
  return <span className={`${styles.badge} ${variantClass}`}>{children}</span>
}

export default CompleteStep
