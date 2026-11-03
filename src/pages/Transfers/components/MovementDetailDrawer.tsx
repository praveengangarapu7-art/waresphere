import React from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { StockMovement } from '../../../types/movement'
import {
  TransferDetail,
  BinMoveDetail,
  AdjustmentDetail,
  ReturnDetail,
  KittingDetail,
  MaterialIssueDetail
} from './details'
import { FileClock, User } from 'lucide-react'
import styles from './MovementDetailDrawer.module.css'

interface MovementDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  movement: StockMovement | null
  onSave: (updated: StockMovement) => void
}

export const MovementDetailDrawer: React.FC<MovementDetailDrawerProps> = ({
  isOpen,
  onClose,
  movement,
  onSave
}) => {
  if (!isOpen || !movement) return null

  const isTransfer = movement.type === 'Inter-Warehouse Transfer'
  const isBinMove = movement.type === 'Bin-to-Bin Move'
  const isAdjustment = movement.type === 'Stock Adjustment'
  const isReturn = movement.type.includes('Return')
  const isKitting = movement.type.includes('Kit')
  const isMaterialIssue = movement.type === 'Material Issue'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${movement.type}: ${movement.movementNumber}`}
    >
      <div className={styles.container}>
        {/* Dynamic Detail Body Router */}
        <div className={styles.bodyViewport}>
          {isTransfer && (
            <TransferDetail movement={movement} onChange={onSave} />
          )}
          {isBinMove && (
            <BinMoveDetail movement={movement} onChange={onSave} />
          )}
          {isAdjustment && (
            <AdjustmentDetail movement={movement} onChange={onSave} />
          )}
          {isReturn && (
            <ReturnDetail movement={movement} onChange={onSave} />
          )}
          {isKitting && (
            <KittingDetail movement={movement} onChange={onSave} />
          )}
          {isMaterialIssue && (
            <MaterialIssueDetail movement={movement} onChange={onSave} />
          )}
        </div>

        {/* Unified Bottom Audit Trail */}
        <div className={styles.auditTrail}>
          <div className={styles.auditHeader}>
            <FileClock size={14} className={styles.auditIcon} />
            <span>Operational Audit Trail</span>
          </div>
          <div className={styles.auditBody}>
            <div className={styles.auditItem}>
              <User size={12} />
              <span>Requested by: <strong>{movement.requestedBy}</strong> on {movement.requestedAt}</span>
            </div>
            {movement.approvedBy && (
              <div className={styles.auditItem}>
                <User size={12} className={styles.iconApproved} />
                <span>Authorized by: <strong>{movement.approvedBy}</strong> on {movement.approvedAt}</span>
              </div>
            )}
            <div className={styles.auditItem}>
              <span>Status Check: <strong className={styles.statusBold}>{movement.status}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default MovementDetailDrawer
