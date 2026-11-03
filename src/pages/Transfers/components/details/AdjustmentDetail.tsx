import React from 'react'
import { StockMovement } from '../../../../types/movement'
import { useRole } from '../../../../hooks/useRole'
import { formatCurrency } from '../../../../utils/formatCurrency'
import { Check, CheckCircle, XCircle } from 'lucide-react'
import styles from './Details.module.css'

interface AdjustmentDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const AdjustmentDetail: React.FC<AdjustmentDetailProps> = ({
  movement,
  onChange
}) => {
  const { activeRole } = useRole()

  const value = movement.valueImpact || 0
  const isAutoApproved = value < 10000
  const needsSupervisor = value >= 10000 && value <= 50000
  const needsManager = value > 50000

  // Check if current role is authorized to approve
  const isAuthorized = () => {
    if (activeRole === 'Operations Director') return true
    if (needsManager && activeRole === 'Warehouse Manager') return true
    if (needsSupervisor && (activeRole === 'Warehouse Supervisor' || activeRole === 'Warehouse Manager')) return true
    if (isAutoApproved) return true // Staff can process if auto-approved
    return false
  }

  const handleApprove = () => {
    onChange({
      ...movement,
      status: 'Approved',
      approvedBy: activeRole,
      approvedAt: new Date().toISOString().split('T')[0]
    })
  }

  const handleReject = () => {
    onChange({
      ...movement,
      status: 'Rejected',
      approvedBy: activeRole,
      approvedAt: new Date().toISOString().split('T')[0]
    })
  }

  const getRequiredRoleString = () => {
    if (needsManager) return 'Warehouse Manager or above'
    if (needsSupervisor) return 'Warehouse Supervisor or above'
    return 'Authorized Staff'
  }

  return (
    <div className={styles.container}>
      <div className={styles.adjustBox}>
        <div className={styles.moveRow}>
          <span>Adjusting SKU:</span>
          <strong>SKU #{movement.lineItems[0]?.skuId}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Quantity Delta:</span>
          <strong className={movement.lineItems[0]?.quantity < 0 ? styles.negativeVal : styles.positiveVal}>
            {movement.lineItems[0]?.quantity > 0 ? '+' : ''}{movement.lineItems[0]?.quantity} units
          </strong>
        </div>
        <div className={styles.moveRow}>
          <span>Mandatory Reason:</span>
          <strong>{movement.reasonCode || 'Counting Variance'}</strong>
        </div>
        <div className={styles.moveRow}>
          <span>Estimated Asset Value Impact:</span>
          <strong>{formatCurrency(value)}</strong>
        </div>
      </div>

      {/* Approval Tier metadata */}
      <div className={styles.tierBox}>
        <span>Authorization Level:</span>
        <strong className={needsManager ? styles.alertText : styles.normalText}>
          {isAutoApproved ? 'System Auto-Approval' : `Requires Approval from: ${getRequiredRoleString()}`}
        </strong>
      </div>

      <div className={styles.actionsBlock}>
        {movement.status === 'Pending Approval' && (
          <div className={styles.approvalWrapper}>
            {isAuthorized() ? (
              <div className={styles.btnRow}>
                <button onClick={handleReject} className={styles.btnReject}>
                  <XCircle size={14} />
                  <span>Reject Adjustment</span>
                </button>
                <button onClick={handleApprove} className={styles.btnApprove}>
                  <CheckCircle size={14} />
                  <span>Approve Adjustment</span>
                </button>
              </div>
            ) : (
              <p className={styles.lockText}>Your active role ({activeRole}) is not authorized to sign-off this adjustment.</p>
            )}
          </div>
        )}

        {movement.status === 'Approved' && (
          <div className={styles.successBadge}>
            <Check size={14} />
            <span>Adjustment Approved & Applied by {movement.approvedBy}</span>
          </div>
        )}

        {movement.status === 'Completed' && (
          <div className={styles.successBadge}>
            <Check size={14} />
            <span>Adjustment Auto-Applied</span>
          </div>
        )}

        {movement.status === 'Rejected' && (
          <div className={styles.rejectionBox}>
            <strong>Adjustment Rejected by {movement.approvedBy}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
export default AdjustmentDetail
