import React, { useState } from 'react'
import { StockMovement } from '../../../../types/movement'
import { Check, AlertCircle } from 'lucide-react'
import styles from './Details.module.css'

interface ReturnDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const ReturnDetail: React.FC<ReturnDetailProps> = ({
  movement,
  onChange
}) => {
  const [decision, setDecision] = useState<'Accepted' | 'Scrapped' | 'Hold' | null>(
    movement.status === 'Completed' ? 'Accepted' : movement.status === 'Rejected' ? 'Scrapped' : null
  )

  const handleInspect = (status: 'Accepted' | 'Scrapped' | 'Hold') => {
    setDecision(status)
    onChange({
      ...movement,
      status: status === 'Accepted' ? 'Completed' : status === 'Scrapped' ? 'Rejected' : 'Pending Approval'
    })
  }

  const returnReasons = [
    'Wrong Item Delivered',
    'Damaged in Transit',
    'Quality Defect Mismatch',
    'Overstock Return',
    'Expired Stock'
  ]

  return (
    <div className={styles.container}>
      <div className={styles.adjustBox}>
        <div className={styles.moveRow}>
          <span>Reference RMA/PO:</span>
          <strong>{movement.movementNumber}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Counterparty Name:</span>
          <strong>{movement.counterpartyName || 'Appollo Pharma Distributor'}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>SKU & Quantity:</span>
          <strong>SKU #{movement.lineItems[0]?.skuId} ({movement.lineItems[0]?.quantity} units)</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Claim Reason:</span>
          <strong>{movement.reasonCode || 'Wrong Item Delivered'}</strong>
        </div>
      </div>

      {/* Quality Decision panel */}
      <div className={styles.inspectionSection}>
        <h4 className={styles.sectionTitle}>Quality Inspector Decision</h4>
        
        {decision === null ? (
          <div className={styles.btnRow}>
            <button onClick={() => handleInspect('Scrapped')} className={styles.btnReject}>
              Scrap (Write-Off)
            </button>
            <button onClick={() => handleInspect('Hold')} className={styles.btnHold}>
              Hold for Review
            </button>
            <button onClick={() => handleInspect('Accepted')} className={styles.btnApprove}>
              Accept Back to Stock
            </button>
          </div>
        ) : (
          <div className={styles.decisionFeedback}>
            <Check size={16} className={styles.successIcon} />
            <div>
              <span>Status Action: <strong>{decision}</strong></span>
              {decision === 'Accepted' && (
                <p className={styles.helperText}>Mock action: Stock ledger values incremented (+{movement.lineItems[0]?.quantity} units).</p>
              )}
              {decision === 'Scrapped' && (
                <p className={styles.helperText}>Mock action: Scrap write-off value recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default ReturnDetail
