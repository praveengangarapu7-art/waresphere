import React from 'react'
import { StockMovementTimeline } from '../../../components/domain/StockMovementTimeline/StockMovementTimeline'
import { SkuMovement } from '../../../types/sku'
import styles from './TabsContent.module.css'

interface MovementHistoryTabProps {
  movements?: SkuMovement[]
  unit: string
}

export const MovementHistoryTab: React.FC<MovementHistoryTabProps> = ({
  movements = [],
  unit
}) => {
  return (
    <div className={styles.tabContent}>
      <StockMovementTimeline movements={movements} unit={unit} />
    </div>
  )
}
export default MovementHistoryTab
