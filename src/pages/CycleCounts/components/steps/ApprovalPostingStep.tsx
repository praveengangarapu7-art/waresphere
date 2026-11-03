import React, { useMemo, useState } from 'react'
import { CycleCount } from '../../../../types/cycleCount'
import { useRole } from '../../../../hooks/useRole'
import { formatCurrency } from '../../../../utils/formatCurrency'
import {
  Check,
  CheckCircle,
  AlertOctagon,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  X,
} from 'lucide-react'
import styles from './Steps.module.css'

interface ApprovalPostingStepProps {
  count: CycleCount
  onChange: (updated: CycleCount) => void
  onReject: () => void
}

const UNIT_RATE      = 150
const SUPERVISOR_MIN = 10000  // ₹10,000+  → Supervisor required
const MANAGER_MIN    = 50000  // ₹50,000+  → Manager required

export const ApprovalPostingStep: React.FC<ApprovalPostingStepProps> = ({
  count,
  onChange,
  onReject,
}) => {
  const { activeRole } = useRole()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const totalVarianceValue = useMemo(() =>
    count.items.reduce((acc, i) => acc + Math.abs(i.varianceQty || 0) * UNIT_RATE, 0),
  [count])

  // Approval tier logic
  const approvalTier: CycleCount['approvalTier'] = useMemo(() => {
    if (totalVarianceValue >= MANAGER_MIN)  return 'Manager'
    if (totalVarianceValue >= SUPERVISOR_MIN) return 'Supervisor'
    return 'Auto'
  }, [totalVarianceValue])

  const isAuthorized = (): boolean => {
    if (approvalTier === 'Auto') return true
    if (activeRole === 'Operations Director') return true
    if (approvalTier === 'Manager') {
      return activeRole === 'Warehouse Manager'
    }
    if (approvalTier === 'Supervisor') {
      return activeRole === 'Warehouse Supervisor' || activeRole === 'Warehouse Manager'
    }
    return false
  }

  const requiredRoleLabel = (): string => {
    if (approvalTier === 'Auto')       return 'Auto-approved (no manual sign-off required)'
    if (approvalTier === 'Manager')    return 'Warehouse Manager or Operations Director'
    if (approvalTier === 'Supervisor') return 'Warehouse Supervisor, Manager, or Operations Director'
    return 'Authorized Staff'
  }

  const tierBadgeClass = approvalTier === 'Auto'
    ? styles.tierAuto
    : approvalTier === 'Supervisor'
      ? styles.tierSupervisor
      : styles.tierManager

  const handleApprove = () => {
    onChange({
      ...count,
      status: 'Completed',
      approvedBy: activeRole,
      completedAt: new Date().toISOString().split('T')[0],
      approvalTier,
    })
  }

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) return
    onChange({
      ...count,
      status: 'Rejected',
      rejectReason,
    })
    onReject()
  }

  const overallAccuracy = useMemo(() => {
    const sysSum = count.items.reduce((a, i) => a + i.systemQty, 0)
    const varSum = count.items.reduce((a, i) => a + Math.abs(i.varianceQty || 0), 0)
    if (sysSum === 0) return 100
    return parseFloat(((sysSum - varSum) / sysSum * 100).toFixed(2))
  }, [count])

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 4 — Approval &amp; Ledger Posting</h3>

      {/* Variance summary */}
      <div className={styles.varianceSummary}>
        <div className={styles.summaryRow}>
          <span>Audit Inventory Accuracy</span>
          <strong className={overallAccuracy >= 98 ? styles.successText : styles.warnText}>
            {overallAccuracy}%
          </strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Total Variance Value Impact</span>
          <strong className={totalVarianceValue >= MANAGER_MIN ? styles.criticalText : totalVarianceValue >= SUPERVISOR_MIN ? styles.warnText : ''}>
            {formatCurrency(totalVarianceValue)}
          </strong>
        </div>
        <div className={styles.summaryRow}>
          <span>Approval Authority Tier</span>
          <span className={`${styles.tierPill} ${tierBadgeClass}`}>
            {approvalTier === 'Auto' ? (
              <><ShieldCheck size={12} /> Auto-Approval</>
            ) : approvalTier === 'Supervisor' ? (
              <><ShieldAlert size={12} /> Supervisor Required</>
            ) : (
              <><AlertOctagon size={12} /> Manager Required</>
            )}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span>Required Sign-off</span>
          <span className={styles.requiredRole}>{requiredRoleLabel()}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Your Active Role</span>
          <strong>{activeRole}</strong>
        </div>
      </div>

      {/* Tier thresholds legend */}
      <div className={styles.tierLegend}>
        <div className={`${styles.tierLegendItem} ${totalVarianceValue < SUPERVISOR_MIN ? styles.tierLegendActive : ''}`}>
          <ShieldCheck size={12} />
          <span>Auto (&lt; ₹10,000)</span>
        </div>
        <div className={styles.tierLegendArrow}>→</div>
        <div className={`${styles.tierLegendItem} ${totalVarianceValue >= SUPERVISOR_MIN && totalVarianceValue < MANAGER_MIN ? styles.tierLegendActive : ''}`}>
          <ShieldAlert size={12} />
          <span>Supervisor (₹10K – ₹50K)</span>
        </div>
        <div className={styles.tierLegendArrow}>→</div>
        <div className={`${styles.tierLegendItem} ${totalVarianceValue >= MANAGER_MIN ? styles.tierLegendActive : ''}`}>
          <AlertOctagon size={12} />
          <span>Manager (&gt; ₹50,000)</span>
        </div>
      </div>

      {/* Actions block */}
      <div className={styles.actionsBlock}>

        {/* Pending Approval state */}
        {count.status === 'Pending Approval' && !showRejectForm && (
          <>
            {isAuthorized() ? (
              <div className={styles.approvalWrapper}>
                <div className={styles.authGranted}>
                  <CheckCircle size={14} />
                  <span>Your role (<strong>{activeRole}</strong>) is authorized to approve this count.</span>
                </div>
                <div className={styles.btnRow}>
                  <button
                    className={styles.btnReject}
                    onClick={() => setShowRejectForm(true)}
                  >
                    <XCircle size={14} />
                    Reject / Recount
                  </button>
                  <button className={styles.btnApprove} onClick={handleApprove}>
                    <CheckCircle size={14} />
                    Approve &amp; Post Adjustments
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.lockBox}>
                <AlertOctagon size={18} />
                <div>
                  <strong>Insufficient Role</strong>
                  <p>
                    Your active role (<strong>{activeRole}</strong>) cannot approve this count.
                    A total variance of <strong>{formatCurrency(totalVarianceValue)}</strong> requires sign-off from:{' '}
                    <strong>{requiredRoleLabel()}</strong>.
                  </p>
                  <p className={styles.lockHint}>
                    Switch your role via the Role Selector in the top navigation to a qualifying role, or request approval from the appropriate manager.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reject / Recount form */}
        {showRejectForm && count.status === 'Pending Approval' && (
          <div className={styles.rejectForm}>
            <div className={styles.rejectFormHeader}>
              <RotateCcw size={15} />
              <strong>Reject and Send for Recount</strong>
              <button className={styles.rejectFormClose} onClick={() => setShowRejectForm(false)}>
                <X size={14} />
              </button>
            </div>
            <p className={styles.rejectFormDesc}>
              Provide the reason for rejection. The count will be sent back to execution (Step 2) for a recount.
            </p>
            <textarea
              className={styles.rejectReasonInput}
              placeholder="Describe the reason for rejection and recount instructions…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className={styles.btnRow}>
              <button className={styles.btnNav} onClick={() => setShowRejectForm(false)}>Cancel</button>
              <button
                className={styles.btnReject}
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
              >
                <RotateCcw size={13} />
                Send for Recount
              </button>
            </div>
          </div>
        )}

        {/* Completed state */}
        {count.status === 'Completed' && (
          <div className={styles.successBadge}>
            <Check size={15} />
            <div>
              <strong>Count Posted &amp; Adjustments Applied</strong>
              <p>Variance adjustments applied by <strong>{count.approvedBy || 'System'}</strong> on {count.completedAt}.</p>
            </div>
          </div>
        )}

        {/* Rejected state */}
        {count.status === 'Rejected' && (
          <div className={styles.rejectionBox}>
            <RotateCcw size={14} />
            <div>
              <strong>Sent Back for Recount</strong>
              {count.rejectReason && <p>{count.rejectReason}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalPostingStep
