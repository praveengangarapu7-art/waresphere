import React, { useState } from 'react'
import { StockMovement } from '../../../../types/movement'
import { Table } from '../../../../components/ui/Table/Table'
import { Check } from 'lucide-react'
import styles from './Details.module.css'

interface KittingDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const KittingDetail: React.FC<KittingDetailProps> = ({
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

  const isAssembly = movement.type === 'Kit Assembly'

  return (
    <div className={styles.container}>
      <div className={styles.kitSummary}>
        <span>Operation Profile:</span>
        <strong>{isAssembly ? 'Assemble Parent Kit SKU' : 'Disassemble Parent Kit SKU'}</strong>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Component Consumptions & Output</h4>
        <Table headers={['SKU Identification', 'Role', 'Quantity Delta']}>
          {movement.lineItems.map((item, idx) => {
            const isParent = item.quantity > 0 && isAssembly
            
            return (
              <tr key={idx}>
                <td><strong>SKU #{item.skuId}</strong></td>
                <td>
                  <span className={isParent ? styles.allocatedText : styles.negativeVal}>
                    {isParent ? 'Parent Kit' : 'Component SKU'}
                  </span>
                </td>
                <td>
                  <strong className={item.quantity < 0 ? styles.negativeVal : styles.positiveVal}>
                    {item.quantity > 0 ? '+' : ''}{item.quantity} units
                  </strong>
                </td>
              </tr>
            )
          })}
        </Table>
      </div>

      <div className={styles.actionsBlock}>
        {completed ? (
          <div className={styles.successBadge}>
            <Check size={14} />
            <span>Kitting Operations Sign-off Completed</span>
          </div>
        ) : (
          <button onClick={handleConfirm} className={styles.btnConfirm}>
            Execute Kitting Operation
          </button>
        )}
      </div>
    </div>
  )
}
export default KittingDetail
