import React, { useState } from 'react'
import { StockMovement } from '../../../../types/movement'
import { Check } from 'lucide-react'
import styles from './Details.module.css'

interface BinMoveDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const BinMoveDetail: React.FC<BinMoveDetailProps> = ({
  movement,
  onChange
}) => {
  const [confirmed, setConfirmed] = useState(movement.status === 'Completed')

  const handleConfirm = () => {
    setConfirmed(true)
    onChange({
      ...movement,
      status: 'Completed'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.moveBox}>
        <div className={styles.moveRow}>
          <span>Target Relocating SKU:</span>
          <strong>SKU #{movement.lineItems[0]?.skuId}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Quantity to Move:</span>
          <strong>{movement.lineItems[0]?.quantity} units</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Source Bin:</span>
          <strong>{movement.fromBin || 'Zone A · Bin A-01-05'}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Destination Bin:</span>
          <strong>{movement.toBin || 'Zone A · Bin A-01-12'}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Reason for Move:</span>
          <strong>{movement.reasonCode || 'Re-slotting Optimization'}</strong>
        </div>
      </div>

      <div className={styles.actionsBlock}>
        {confirmed ? (
          <div className={styles.successBadge}>
            <Check size={14} />
            <span>Bin Relocation Completed</span>
          </div>
        ) : (
          <button onClick={handleConfirm} className={styles.btnConfirm}>
            Confirm Bin Relocation
          </button>
        )}
      </div>
    </div>
  )
}
export default BinMoveDetail
