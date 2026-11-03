import React, { useState } from 'react'
import { StockMovement } from '../../../../types/movement'
import { Check } from 'lucide-react'
import styles from './Details.module.css'

interface MaterialIssueDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const MaterialIssueDetail: React.FC<MaterialIssueDetailProps> = ({
  movement,
  onChange
}) => {
  const [completed, setCompleted] = useState(movement.status === 'Completed')

  const handleConfirm = () => {
    setCompleted(true)
    onChange({
      ...movement,
      status: 'Completed'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.adjustBox}>
        <div className={styles.moveRow}>
          <span>Production Order Ref:</span>
          <strong>PO-PROD-2026</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Issued Item:</span>
          <strong>SKU #{movement.lineItems[0]?.skuId} ({movement.lineItems[0]?.quantity} units)</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Lot / Batch Traceability Number:</span>
          <strong><code>{movement.lineItems[0]?.batchNumber || 'BAT-CHEM-101'}</code></strong>
        </div>
        <div className={styles.moveRow}>
          <span>Department Line:</span>
          <strong>{movement.reasonCode || 'Production Line #3'}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Issued By:</span>
          <strong>{movement.requestedBy}</strong>
        </div>
      </div>

      <div className={styles.actionsBlock}>
        {completed ? (
          <div className={styles.successBadge}>
            <Check size={14} />
            <span>Materials Issued to Production Line</span>
          </div>
        ) : (
          <button onClick={handleConfirm} className={styles.btnConfirm}>
            Confirm Material Issue Release
          </button>
        )}
      </div>
    </div>
  )
}
export default MaterialIssueDetail
