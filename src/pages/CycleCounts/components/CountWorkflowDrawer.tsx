import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { CycleCount } from '../../../types/cycleCount'
import { PlanDetailsStep } from './steps/PlanDetailsStep'
import { CountExecutionStep } from './steps/CountExecutionStep'
import { VarianceReviewStep } from './steps/VarianceReviewStep'
import { ApprovalPostingStep } from './steps/ApprovalPostingStep'
import { Check, ChevronLeft, ChevronRight, Save, AlertTriangle } from 'lucide-react'
import styles from './CountWorkflowDrawer.module.css'

interface CountWorkflowDrawerProps {
  isOpen: boolean
  onClose: () => void
  count: CycleCount | null
  onSave: (updated: CycleCount) => void
}

const STEPS = [
  { label: 'Plan Details',   key: 'plan'      },
  { label: 'Count Execution', key: 'execution' },
  { label: 'Variance Review', key: 'variance'  },
  { label: 'Approval',        key: 'approval'  },
]

// Map CycleCount.status → the step index the drawer should start at
function statusToStep(status: CycleCount['status']): number {
  switch (status) {
    case 'Scheduled':        return 0
    case 'In Progress':      return 1
    case 'Pending Approval': return 2
    case 'Completed':        return 3
    case 'Rejected':         return 1 // Rejected goes back to execution for recount
    default:                 return 0
  }
}

export const CountWorkflowDrawer: React.FC<CountWorkflowDrawerProps> = ({
  isOpen,
  onClose,
  count,
  onSave,
}) => {
  const [currentStep, setCurrentStep]   = useState(0)
  const [editedCount, setEditedCount]   = useState<CycleCount | null>(null)
  const [partialWarn, setPartialWarn]   = useState(false)

  // Sync + resume when a count is opened
  useEffect(() => {
    if (count) {
      setEditedCount({ ...count })
      setCurrentStep(statusToStep(count.status))
      setPartialWarn(false)
    }
  }, [count])

  if (!isOpen || !editedCount) return null

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleCountChange = (updated: CycleCount) => {
    setEditedCount(updated)
  }

  const handleSaveDraft = () => {
    if (editedCount) {
      onSave(editedCount)
    }
  }

  // Whether the execution step is complete enough to advance
  const allItemsCounted = editedCount.items.every(i => i.countedQty !== undefined)
  const anyItemCounted  = editedCount.items.some(i => i.countedQty !== undefined)

  const handleNext = () => {
    if (currentStep === 1) {
      // Execution → Variance
      if (!allItemsCounted) {
        if (!anyItemCounted) return // Nothing at all counted — block silently
        setPartialWarn(true)
        return
      }
    }
    setPartialWarn(false)

    const nextStep = Math.min(currentStep + 1, STEPS.length - 1)
    setCurrentStep(nextStep)

    // Advance the count status when moving forward past execution
    if (currentStep === 1 && editedCount.status !== 'Pending Approval') {
      const updatedCount: CycleCount = {
        ...editedCount,
        status: 'Pending Approval',
        // Compute approval tier
        approvalTier: computeApprovalTier(editedCount),
      }
      setEditedCount(updatedCount)
      onSave(updatedCount)
    } else if (currentStep === 0 && editedCount.status === 'Scheduled') {
      const updatedCount: CycleCount = { ...editedCount, status: 'In Progress' }
      setEditedCount(updatedCount)
      onSave(updatedCount)
    } else {
      onSave(editedCount)
    }
  }

  const handleBack = () => {
    setPartialWarn(false)
    setCurrentStep(s => Math.max(s - 1, 0))
  }

  // When approval step approves/rejects, auto-close or stay open
  const handleApprovalChange = (updated: CycleCount) => {
    setEditedCount(updated)
    onSave(updated)
    if (updated.status === 'Completed') {
      setTimeout(onClose, 1200) // brief flash of success then close
    } else if (updated.status === 'Rejected') {
      setCurrentStep(1) // Send back to execution
    }
  }

  // Advance partial submission warning
  const handleForceAdvance = () => {
    setPartialWarn(false)
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1))
    const updatedCount: CycleCount = {
      ...editedCount,
      status: 'Pending Approval',
      approvalTier: computeApprovalTier(editedCount),
    }
    setEditedCount(updatedCount)
    onSave(updatedCount)
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Count Workflow — ${editedCount.countNumber}`}
    >
      <div className={styles.container}>
        {/* ── Stepper ──────────────────────────────────────────────────────── */}
        <div className={styles.stepper}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isActive    = idx === currentStep
            return (
              <React.Fragment key={step.key}>
                <button
                  className={`${styles.stepNode} ${isActive ? styles.activeNode : ''} ${isCompleted ? styles.completedNode : ''}`}
                  onClick={() => setCurrentStep(idx)}
                  title={step.label}
                  type="button"
                >
                  <div className={styles.circle}>
                    {isCompleted ? <Check size={11} /> : idx + 1}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`${styles.connector} ${isCompleted ? styles.completedConnector : ''}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* ── Step content ─────────────────────────────────────────────────── */}
        <div className={styles.stepContent}>
          {currentStep === 0 && (
            <PlanDetailsStep count={editedCount} />
          )}
          {currentStep === 1 && (
            <CountExecutionStep count={editedCount} onChange={handleCountChange} />
          )}
          {currentStep === 2 && (
            <VarianceReviewStep count={editedCount} />
          )}
          {currentStep === 3 && (
            <ApprovalPostingStep
              count={editedCount}
              onChange={handleApprovalChange}
              onReject={() => setCurrentStep(1)}
            />
          )}
        </div>

        {/* ── Partial submission warning ────────────────────────────────────── */}
        {partialWarn && (
          <div className={styles.partialWarn}>
            <AlertTriangle size={15} />
            <span>
              Not all bins have been counted yet ({editedCount.items.filter(i => i.countedQty !== undefined).length} of {editedCount.items.length} done).
              Submit partial count anyway?
            </span>
            <div className={styles.partialWarnActions}>
              <button className={styles.btnWarnCancel} onClick={() => setPartialWarn(false)}>Continue counting</button>
              <button className={styles.btnWarnConfirm} onClick={handleForceAdvance}>Submit partial</button>
            </div>
          </div>
        )}

        {/* ── Navigation bar ───────────────────────────────────────────────── */}
        <div className={styles.actionsBar}>
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={styles.btnNav}
          >
            <ChevronLeft size={15} />
            Back
          </button>

          <div className={styles.rightActions}>
            <button type="button" onClick={handleSaveDraft} className={styles.btnSave}>
              <Save size={13} />
              Save Draft
            </button>

            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                className={styles.btnNavPrimary}
              >
                {currentStep === 0 ? 'Begin Count' : 'Continue'}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Compute approval tier from variance value ───────────────────────────────
function computeApprovalTier(count: CycleCount): CycleCount['approvalTier'] {
  const total = count.items.reduce((acc, i) => {
    const v = Math.abs(i.varianceQty || 0)
    return acc + v * 150 // ~₹150 avg unit cost
  }, 0)
  if (total > 50000) return 'Manager'
  if (total >= 10000) return 'Supervisor'
  return 'Auto'
}

export default CountWorkflowDrawer
