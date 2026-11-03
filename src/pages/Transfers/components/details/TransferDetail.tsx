import React from 'react'
import { StockMovement } from '../../../../types/movement'
import { useRole } from '../../../../hooks/useRole'
import { Table } from '../../../../components/ui/Table/Table'
import { mockWarehouses } from '../../../../mock-data/warehouses'
import { Check, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import styles from './Details.module.css'

interface TransferDetailProps {
  movement: StockMovement
  onChange: (updated: StockMovement) => void
}

export const TransferDetail: React.FC<TransferDetailProps> = ({
  movement,
  onChange
}) => {
  const { activeRole } = useRole()
  
  const isSupervisorOrAbove = activeRole === 'Warehouse Supervisor' || activeRole === 'Warehouse Manager' || activeRole === 'Operations Director'

  const getWarehouseName = (id?: string) => {
    if (!id) return '—'
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
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
    const reason = prompt('Please enter a rejection reason:')
    if (reason === null) return
    onChange({
      ...movement,
      status: 'Rejected',
      approvedBy: activeRole,
      approvedAt: new Date().toISOString().split('T')[0],
      reasonCode: reason || 'Audit constraints'
    })
  }

  const handleDispatch = () => {
    onChange({
      ...movement,
      status: 'In Transit'
    })
  }

  const handleReceive = () => {
    onChange({
      ...movement,
      status: 'Received'
    })
  }

  // Determine current step index
  const statusSteps = ['Requested', 'Approved', 'In Transit', 'Received']
  const currentStep = statusSteps.indexOf(movement.status === 'Pending Approval' ? 'Requested' : movement.status === 'Rejected' ? 'Requested' : movement.status)

  return (
    <div className={styles.container}>
      {/* Mini Stepper */}
      <div className={styles.stepper}>
        {statusSteps.map((step, idx) => {
          const isCompleted = idx < currentStep || movement.status === 'Received'
          const isActive = step === (movement.status === 'Pending Approval' ? 'Requested' : movement.status)
          
          return (
            <React.Fragment key={step}>
              <div className={`${styles.stepNode} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                <div className={styles.circle}>
                  {isCompleted ? <Check size={10} /> : idx + 1}
                </div>
                <span className={styles.stepLabel}>{step}</span>
              </div>
              {idx < statusSteps.length - 1 && (
                <div className={`${styles.connector} ${isCompleted ? styles.completedConnect : ''}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      <div className={styles.transferGrid}>
        <div className={styles.transferNode}>
          <span className={styles.nodeLabel}>Source Facility</span>
          <strong>{getWarehouseName(movement.fromWarehouseId)}</strong>
        </div>
        <div className={styles.arrowCol}>
          <ArrowRight size={20} />
        </div>
        <div className={styles.transferNode}>
          <span className={styles.nodeLabel}>Destination Facility</span>
          <strong>{getWarehouseName(movement.toWarehouseId)}</strong>
        </div>
      </div>

      {/* Manifest table */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Manifest Line Items</h4>
        <Table headers={['SKU Identification', 'Quantity Requested']}>
          {movement.lineItems.map((item, idx) => (
            <tr key={idx}>
              <td><strong>SKU #{item.skuId}</strong></td>
              <td><strong>{item.quantity.toLocaleString('en-IN')} units</strong></td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Role Action Controls */}
      <div className={styles.actionsBlock}>
        {movement.status === 'Pending Approval' && (
          <div className={styles.approvalWrapper}>
            {isSupervisorOrAbove ? (
              <div className={styles.btnRow}>
                <button onClick={handleReject} className={styles.btnReject}>
                  <XCircle size={14} />
                  <span>Reject Transfer</span>
                </button>
                <button onClick={handleApprove} className={styles.btnApprove}>
                  <CheckCircle size={14} />
                  <span>Approve Transfer</span>
                </button>
              </div>
            ) : (
              <p className={styles.lockText}>Requires Supervisor / Manager authorization to approve.</p>
            )}
          </div>
        )}

        {movement.status === 'Approved' && (
          <button onClick={handleDispatch} className={styles.btnConfirm}>
            Mark Cargo Dispatched (In Transit)
          </button>
        )}

        {movement.status === 'In Transit' && (
          <button onClick={handleReceive} className={styles.btnConfirm}>
            Confirm Cargo Received at Destination
          </button>
        )}

        {movement.status === 'Rejected' && (
          <div className={styles.rejectionBox}>
            <strong>Rejection Reason:</strong>
            <p>{movement.reasonCode || 'No description provided.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
export default TransferDetail
