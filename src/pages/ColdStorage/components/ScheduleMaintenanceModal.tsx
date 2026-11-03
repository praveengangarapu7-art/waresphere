import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { MaintenanceItem } from '../../../types/coldStorage'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './ScheduleMaintenanceModal.module.css'

interface ScheduleMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Omit<MaintenanceItem, 'id' | 'status'>) => void
}

export const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [equipmentName, setEquipmentName] = useState('')
  const [type, setType] = useState<MaintenanceItem['type']>('Chiller')
  const [warehouseId, setWarehouseId] = useState(mockWarehouses[0]?.id || '')
  const [lastServicedDate, setLastServicedDate] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [vendor, setVendor] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!equipmentName || !lastServicedDate || !nextDueDate || !vendor) {
      alert('Please fill out all required fields.')
      return
    }

    onAdd({
      equipmentName,
      type,
      warehouseId,
      lastServicedDate,
      nextDueDate,
      vendor
    })

    // Reset Form
    setEquipmentName('')
    setType('Chiller')
    setWarehouseId(mockWarehouses[0]?.id || '')
    setLastServicedDate('')
    setNextDueDate('')
    setVendor('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Preventive Service Task">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Equipment Name *</label>
          <input
            type="text"
            value={equipmentName}
            onChange={(e) => setEquipmentName(e.target.value)}
            placeholder="e.g. Carrier Chiller Compressor #5"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Equipment Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className={styles.select}
            >
              <option value="Chiller">Chiller Unit</option>
              <option value="Generator">Backup Generator</option>
              <option value="Sensor Array">Sensor Array</option>
              <option value="Cooling Unit">Cooling Unit</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse Facility *</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className={styles.select}
            >
              {mockWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Last Service Date *</label>
            <input
              type="date"
              value={lastServicedDate}
              onChange={(e) => setLastServicedDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Next Service Due Date *</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Contracted Service Vendor *</label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Carrier Thermo-King Services"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Register Service Task
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default ScheduleMaintenanceModal
