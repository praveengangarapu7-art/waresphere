import React from 'react'
import {
  FileCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Shuffle,
  Sliders,
  RotateCcw,
  Truck,
  HelpCircle
} from 'lucide-react'
import { SkuMovement } from '../../../types/sku'
import styles from './StockMovementTimeline.module.css'

interface StockMovementTimelineProps {
  movements?: SkuMovement[]
  unit: string
}

export const StockMovementTimeline: React.FC<StockMovementTimelineProps> = ({
  movements = [],
  unit
}) => {
  const getIcon = (type: SkuMovement['type']) => {
    switch (type) {
      case 'Receipt/GRN':
        return <FileCheck size={14} />
      case 'Putaway':
        return <ArrowDownToLine size={14} />
      case 'Pick':
        return <ArrowUpFromLine size={14} />
      case 'Bin Transfer':
        return <RefreshCw size={14} />
      case 'Inter-warehouse Transfer':
        return <Shuffle size={14} />
      case 'Adjustment':
        return <Sliders size={14} />
      case 'Return':
        return <RotateCcw size={14} />
      case 'Dispatch':
        return <Truck size={14} />
      default:
        return <HelpCircle size={14} />
    }
  };

  const getMovementColorClass = (type: SkuMovement['type']) => {
    switch (type) {
      case 'Receipt/GRN':
      case 'Putaway':
      case 'Return':
        return styles.positive
      case 'Pick':
      case 'Dispatch':
        return styles.negative
      default:
        return styles.neutral
    }
  }

  if (movements.length === 0) {
    return <div className={styles.empty}>No movement activity recorded for this ledger.</div>
  }

  return (
    <div className={styles.timeline}>
      {movements.map((movement, index) => {
        const isPos = movement.delta >= 0
        return (
          <div key={movement.id} className={styles.item}>
            <div className={styles.timelineIndicator}>
              <div className={`${styles.iconContainer} ${getMovementColorClass(movement.type)}`}>
                {getIcon(movement.type)}
              </div>
              {index < movements.length - 1 && <div className={styles.line} />}
            </div>
            
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.typeText}>{movement.type}</span>
                <span className={styles.timestamp}>{movement.timestamp}</span>
              </div>
              
              <div className={styles.detailsRow}>
                <span className={styles.summaryText}>
                  Quantity delta:{' '}
                  <strong className={isPos ? styles.txtPos : styles.txtNeg}>
                    {isPos ? '+' : ''}{movement.delta.toLocaleString('en-IN')} {unit}
                  </strong>
                </span>
                
                <span className={styles.stockTransition}>
                  Ledger balance: <strong>{movement.before.toLocaleString('en-IN')}</strong> &rarr;{' '}
                  <strong>{movement.after.toLocaleString('en-IN')}</strong> {unit}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.operator}>By: <strong>{movement.user}</strong></span>
                {movement.reason && (
                  <span className={styles.reason}>
                    Reason: <em>{movement.reason}</em>
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default StockMovementTimeline
