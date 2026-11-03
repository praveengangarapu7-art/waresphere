import React, { useState } from 'react'
import { InboundOrder } from '../../../../types/inboundOrder'
import { Scale, Truck } from 'lucide-react'
import styles from './Steps.module.css'

interface GateInWeighbridgeStepProps {
  order: InboundOrder
  onChange: (order: InboundOrder) => void
}

export const GateInWeighbridgeStep: React.FC<GateInWeighbridgeStepProps> = ({
  order,
  onChange
}) => {
  const [vehicle, setVehicle] = useState(order.gateIn?.vehicleNumber || '')
  const [driver, setDriver] = useState(order.gateIn?.driverName || '')
  const [gross, setGross] = useState<number>(order.gateIn?.grossWeight || 0)
  const [tare, setTare] = useState<number>(order.gateIn?.tareWeight || 0)
  
  const netWeight = Math.max(0, gross - tare)

  const handleSave = () => {
    onChange({
      ...order,
      gateIn: {
        vehicleNumber: vehicle,
        driverName: driver,
        grossWeight: gross,
        tareWeight: tare,
        timestamp: order.gateIn?.timestamp || new Date().toISOString().split('T')[0] + ' 10:45'
      }
    })
  }

  // Weighbridge mock capture
  const handleCaptureWeight = () => {
    const mockGross = Math.round(10000 + Math.random() * 8000) // 10-18 tons
    const mockTare = Math.round(6000 + Math.random() * 3000)   // 6-9 tons
    setGross(mockGross)
    setTare(mockTare)

    onChange({
      ...order,
      gateIn: {
        vehicleNumber: vehicle,
        driverName: driver,
        grossWeight: mockGross,
        tareWeight: mockTare,
        timestamp: new Date().toISOString().split('T')[0] + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0')
      }
    })
  }

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 2: Gate-In Registry & Weighbridge Scale</h3>
      
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Vehicle Plate Number *</label>
          <input
            type="text"
            value={vehicle}
            onChange={(e) => { setVehicle(e.target.value); handleSave() }}
            placeholder="e.g. MH-12-PQ-9912"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Driver Name & Contact *</label>
          <input
            type="text"
            value={driver}
            onChange={(e) => { setDriver(e.target.value); handleSave() }}
            placeholder="Driver Name"
            required
            className={styles.input}
          />
        </div>
      </div>

      {/* Weighbridge Simulation Section */}
      <div className={styles.weighbridgeBox}>
        <div className={styles.wbHeader}>
          <Scale size={18} className={styles.scaleIcon} />
          <h4>Integrated Weighbridge Telemetry</h4>
          <button 
            type="button" 
            onClick={handleCaptureWeight} 
            className={styles.btnCapture}
          >
            <Truck size={14} />
            <span>Simulate Scale Reading</span>
          </button>
        </div>

        <div className={styles.weightInputs}>
          <div className={styles.wItem}>
            <span className={styles.wLabel}>Gross Truck Weight</span>
            <div className={styles.wValueRow}>
              <strong>{gross.toLocaleString()}</strong> <span className={styles.wUnit}>kg</span>
            </div>
          </div>
          <div className={styles.wItem}>
            <span className={styles.wLabel}>Tare Empty Weight</span>
            <div className={styles.wValueRow}>
              <strong>{tare.toLocaleString()}</strong> <span className={styles.wUnit}>kg</span>
            </div>
          </div>
          <div className={styles.wItem}>
            <span className={styles.wLabel}>Computed Cargo Net Weight</span>
            <div className={styles.wValueRow}>
              <strong className={styles.netWeight}>{netWeight.toLocaleString()}</strong> <span className={styles.wUnit}>kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default GateInWeighbridgeStep
