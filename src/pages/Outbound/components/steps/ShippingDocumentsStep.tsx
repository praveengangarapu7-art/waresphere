import React, { useState } from 'react'
import { OutboundOrder } from '../../../../types/outboundOrder'
import { DocumentPreview } from '../DocumentPreview'
import { FileText, Truck, Check } from 'lucide-react'
import styles from './Steps.module.css'

interface ShippingDocumentsStepProps {
  order: OutboundOrder
  onChange: (order: OutboundOrder) => void
}

export const ShippingDocumentsStep: React.FC<ShippingDocumentsStepProps> = ({
  order,
  onChange
}) => {
  const [vehicle, setVehicle] = useState(order.vehicleNumber || '')
  const [carrier, setCarrier] = useState(order.logisticsPartner || '')
  const [documentsGenerated, setDocumentsGenerated] = useState(!!order.ewayBillNumber || order.invoiceValue < 50000)
  const [dispatchStage, setDispatchStage] = useState<'loaded' | 'dispatched' | 'draft'>(
    order.status === 'Dispatched' ? 'dispatched' : order.status === 'Loaded' ? 'loaded' : 'draft'
  )

  const handleSaveForms = () => {
    onChange({
      ...order,
      vehicleNumber: vehicle,
      logisticsPartner: carrier
    })
  }

  const handleGenerateDocs = () => {
    setDocumentsGenerated(true)
    onChange({
      ...order,
      ewayBillNumber: order.invoiceValue > 50000 ? `EWB-2026-${Math.floor(100000 + Math.random() * 900000)}` : undefined
    })
  }

  const handleLoadCargo = () => {
    setDispatchStage('loaded')
    onChange({
      ...order,
      status: 'Loaded'
    })
  }

  const handleDispatchCargo = () => {
    setDispatchStage('dispatched')
    onChange({
      ...order,
      status: 'Dispatched',
      dispatchedAt: new Date().toISOString().split('T')[0] + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0')
    })
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 4: Tax Compliances & Load Gate-Out</h3>

      <div className={styles.docsSplit}>
        {/* Left Column: Form & Actions */}
        <div className={styles.docsFormCol}>
          {/* Document Generation */}
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <FileText size={16} className={styles.docIcon} />
              <h4>GST Document Printing</h4>
            </div>
            {!documentsGenerated ? (
              <button
                type="button"
                onClick={handleGenerateDocs}
                className={styles.btnPrimaryAction}
              >
                Generate Tax Invoice & e-Way Bill
              </button>
            ) : (
              <span className={styles.successBadge}>
                <Check size={12} />
                <span>GST Manifest Generated</span>
              </span>
            )}
          </div>

          {/* Carrier Details */}
          <div className={styles.carrierBox}>
            <h4>Logistics & Carrier Details</h4>
            <div className={styles.formGroup}>
              <label className={styles.label}>Logistics Partner *</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => { setCarrier(e.target.value); handleSaveForms() }}
                placeholder="e.g. Safexpress / BlueDart"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Vehicle Number *</label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => { setVehicle(e.target.value); handleSaveForms() }}
                placeholder="e.g. MH-14-GH-1221"
                required
                className={styles.input}
              />
            </div>
          </div>

          {/* Loading / Dispatch toggles */}
          {documentsGenerated && vehicle && carrier && (
            <div className={styles.dispatchActions}>
              {dispatchStage === 'draft' && (
                <button
                  type="button"
                  onClick={handleLoadCargo}
                  className={styles.btnPrimaryAction}
                >
                  <Truck size={14} />
                  <span>Confirm Cargo Loaded</span>
                </button>
              )}

              {dispatchStage === 'loaded' && (
                <button
                  type="button"
                  onClick={handleDispatchCargo}
                  className={styles.btnPrimaryAction}
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Truck size={14} />
                  <span>Release Vehicle (Dispatch)</span>
                </button>
              )}

              {dispatchStage === 'dispatched' && (
                <div className={styles.successBadge}>
                  <Check size={14} />
                  <span>Cargo Dispatched Gate-Out</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: GST Document Preview */}
        <div className={styles.docsPreviewCol}>
          <DocumentPreview order={order} />
        </div>
      </div>
    </div>
  )
}
export default ShippingDocumentsStep
