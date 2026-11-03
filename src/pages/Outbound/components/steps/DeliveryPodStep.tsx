import React, { useState } from 'react'
import { OutboundOrder } from '../../../../types/outboundOrder'
import { CheckSquare, AlertCircle, MapPin, Camera } from 'lucide-react'
import styles from './Steps.module.css'

interface DeliveryPodStepProps {
  order: OutboundOrder
  onComplete: () => void
  onChange: (order: OutboundOrder) => void
}

export const DeliveryPodStep: React.FC<DeliveryPodStepProps> = ({
  order,
  onComplete,
  onChange
}) => {
  const [transitState, setTransitState] = useState<'dispatched' | 'intransit' | 'delivered'>(
    order.status === 'Delivered' ? 'delivered' : order.status === 'In Transit' ? 'intransit' : 'dispatched'
  )

  const [signature, setSignature] = useState(order.podSignature || '')
  const [photo, setPhoto] = useState(!!order.podPhotoCaptured)

  const handleTransitToggle = () => {
    setTransitState('intransit')
    onChange({
      ...order,
      status: 'In Transit'
    })
  }

  const handleArrivalToggle = () => {
    setTransitState('delivered')
    onChange({
      ...order,
      status: 'Delivered',
      deliveredAt: new Date().toISOString().split('T')[0] + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
      podGeolocation: '19.0760° N, 72.8777° E — Mumbai Hub Consignee'
    })
  }

  const handleCapturePod = () => {
    setPhoto(true)
    onChange({
      ...order,
      podPhotoCaptured: true
    })
  }

  const handleSignatureChange = (val: string) => {
    setSignature(val)
    onChange({
      ...order,
      podSignature: val,
      podCaptured: !!val && photo
    })
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 5: Transit & Proof of Delivery (POD)</h3>

      <div className={styles.transitBox}>
        {transitState === 'dispatched' && (
          <button
            type="button"
            onClick={handleTransitToggle}
            className={styles.btnPrimaryAction}
          >
            <span>Set Vehicle In-Transit</span>
          </button>
        )}

        {transitState === 'intransit' && (
          <button
            type="button"
            onClick={handleArrivalToggle}
            className={styles.btnPrimaryAction}
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span>Log Destination Arrival</span>
          </button>
        )}

        {transitState === 'delivered' && (
          <div className={styles.podForm}>
            <h4>Proof of Delivery (POD) Verification</h4>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Consignee Signature Name *</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => handleSignatureChange(e.target.value)}
                  placeholder="e.g. M. Sharma (Receiving Lead)"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Audit Photo Evidence *</label>
                {photo ? (
                  <span className={styles.successBadge} style={{ width: 'fit-content' }}>Cargo Photo Captured</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleCapturePod}
                    className={styles.btnPhotoAction}
                  >
                    <Camera size={14} />
                    <span>Capture Cargo Condition</span>
                  </button>
                )}
              </div>
            </div>

            {/* Geolocation metadata */}
            <div className={styles.geoRow}>
              <MapPin size={14} className={styles.pinIcon} />
              <span>GPS Stamp: <strong>{order.podGeolocation || '19.0760° N, 72.8777° E — Auto Captured'}</strong></span>
            </div>

            {signature && photo && (
              <div className={styles.actionBlock}>
                <button
                  type="button"
                  onClick={onComplete}
                  className={styles.btnFinalComplete}
                >
                  <CheckSquare size={16} />
                  <span>Approve & Close Dispatch</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default DeliveryPodStep
