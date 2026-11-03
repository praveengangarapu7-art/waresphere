import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { InboundOrder } from '../../../types/inboundOrder'
import {
  AsnDetailsStep,
  GateInWeighbridgeStep,
  QualityInspectionStep,
  PutawayStep,
  CompleteStep
} from './steps'
import { Check, ChevronRight, ChevronLeft, Save } from 'lucide-react'
import styles from './ReceivingWorkflowDrawer.module.css'

interface ReceivingWorkflowDrawerProps {
  isOpen: boolean
  onClose: () => void
  order: InboundOrder | null
  onSave: (order: InboundOrder) => void
}

export const ReceivingWorkflowDrawer: React.FC<ReceivingWorkflowDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [editedOrder, setEditedOrder] = useState<InboundOrder | null>(null)

  // Map order status to starting step index
  useEffect(() => {
    if (order) {
      setEditedOrder(order)
      
      // Resume from stored status
      switch (order.status) {
        case 'Pending ASN':
          setCurrentStep(0)
          break
        case 'Arrived / Gate-In':
          setCurrentStep(1)
          break
        case 'Quality Inspection':
          setCurrentStep(2)
          break
        case 'Putaway Pending':
          setCurrentStep(3)
          break
        case 'Completed':
          setCurrentStep(4)
          break
        default:
          setCurrentStep(0)
      }
    }
  }, [order])

  if (!isOpen || !editedOrder) return null

  const stepsList = [
    { label: 'Details', status: 'Pending ASN' },
    { label: 'Gate-In', status: 'Arrived / Gate-In' },
    { label: 'Quality Audit', status: 'Quality Inspection' },
    { label: 'Putaway', status: 'Putaway Pending' },
    { label: 'Sign-Off', status: 'Completed' }
  ]

  const handleOrderChange = (updated: InboundOrder) => {
    setEditedOrder(updated)
    onSave(updated) // Auto-save progress
  }

  const handleNext = () => {
    if (currentStep < stepsList.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Automatically advance order status to keep in sync with stepper progress
      const targetStatus = stepsList[nextStep].status as InboundOrder['status']
      handleOrderChange({
        ...editedOrder,
        status: targetStatus
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinalComplete = () => {
    handleOrderChange({
      ...editedOrder,
      status: 'Completed',
      arrivalDate: editedOrder.arrivalDate || new Date().toISOString().split('T')[0]
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receiving Operations: ${editedOrder.asnNumber || editedOrder.grnNumber}`}
    >
      <div className={styles.container}>
        {/* Horizontal Stepper */}
        <div className={styles.stepper}>
          {stepsList.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isActive = idx === currentStep

            return (
              <React.Fragment key={idx}>
                <div 
                  onClick={() => setCurrentStep(idx)}
                  className={`${styles.stepNode} ${isActive ? styles.activeNode : ''} ${isCompleted ? styles.completedNode : ''}`}
                >
                  <div className={styles.circle}>
                    {isCompleted ? <Check size={12} /> : idx + 1}
                  </div>
                  <span className={styles.stepLabel}>{step.label}</span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className={`${styles.connector} ${isCompleted ? styles.completedConnector : ''}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step Views */}
        <div className={styles.stepContentViewport}>
          {currentStep === 0 && (
            <AsnDetailsStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 1 && (
            <GateInWeighbridgeStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 2 && (
            <QualityInspectionStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 3 && (
            <PutawayStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 4 && (
            <CompleteStep order={editedOrder} onComplete={handleFinalComplete} />
          )}
        </div>

        {/* Navigation Action Buttons */}
        <div className={styles.actionsBar}>
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={styles.btnNav}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          
          <div className={styles.rightActions}>
            <button
              type="button"
              onClick={() => { onSave(editedOrder); alert('Progress saved in-memory successfully.') }}
              className={styles.btnSave}
            >
              <Save size={14} />
              <span>Save draft</span>
            </button>

            {currentStep < stepsList.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className={styles.btnNavPrimary}
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalComplete}
                className={styles.btnNavPrimary}
              >
                <span>Complete Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default ReceivingWorkflowDrawer
