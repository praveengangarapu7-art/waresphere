import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { OutboundOrder } from '../../../types/outboundOrder'
import {
  OrderAllocationStep,
  PickingStep,
  PackingStep,
  ShippingDocumentsStep,
  DeliveryPodStep
} from './steps'
import { Check, ChevronRight, ChevronLeft, Save } from 'lucide-react'
import styles from './DispatchWorkflowDrawer.module.css'

interface DispatchWorkflowDrawerProps {
  isOpen: boolean
  onClose: () => void
  order: OutboundOrder | null
  onSave: (order: OutboundOrder) => void
}

export const DispatchWorkflowDrawer: React.FC<DispatchWorkflowDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [editedOrder, setEditedOrder] = useState<OutboundOrder | null>(null)

  // Map order status to starting step index
  useEffect(() => {
    if (order) {
      setEditedOrder(order)
      
      // Resume from stored status
      switch (order.status) {
        case 'Pending':
          setCurrentStep(0)
          break
        case 'Allocated':
          setCurrentStep(1)
          break
        case 'Picking':
        case 'Picked':
          setCurrentStep(1) // Picking stage
          break
        case 'Packed':
          setCurrentStep(2) // Packing Validation
          break
        case 'Loaded':
        case 'Dispatched':
          setCurrentStep(3) // Shipping Documents & Gateout
          break
        case 'In Transit':
        case 'Delivered':
          setCurrentStep(4) // Delivery & POD
          break
        default:
          setCurrentStep(0)
      }
    }
  }, [order])

  if (!isOpen || !editedOrder) return null

  const stepsList = [
    { label: 'Allocation', status: 'Allocated' },
    { label: 'Picking', status: 'Picking' },
    { label: 'Packing Check', status: 'Packed' },
    { label: 'GST Docs', status: 'Dispatched' },
    { label: 'POD Cargo', status: 'Delivered' }
  ]

  const handleOrderChange = (updated: OutboundOrder) => {
    setEditedOrder(updated)
    onSave(updated) // Auto-save progress
  }

  const handleNext = () => {
    if (currentStep < stepsList.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Automatically advance status to keep in sync with stepper progress
      const targetStatus = stepsList[nextStep].status as OutboundOrder['status']
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
      status: 'Delivered',
      deliveredAt: editedOrder.deliveredAt || new Date().toISOString().split('T')[0],
      podCaptured: true
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch Operations: ${editedOrder.orderNumber}`}
    >
      <div className={styles.container}>
        {/* Stepper */}
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
            <OrderAllocationStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 1 && (
            <PickingStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 2 && (
            <PackingStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 3 && (
            <ShippingDocumentsStep order={editedOrder} onChange={handleOrderChange} />
          )}
          {currentStep === 4 && (
            <DeliveryPodStep order={editedOrder} onChange={handleOrderChange} onComplete={handleFinalComplete} />
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
                <span>Complete Dispatch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default DispatchWorkflowDrawer
