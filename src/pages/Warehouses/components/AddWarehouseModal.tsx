import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { Warehouse } from '../../../types/warehouse'
import styles from './AddWarehouseModal.module.css'

interface AddWarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (warehouse: Omit<Warehouse, 'id' | 'utilization' | 'accuracy' | 'openAlerts' | 'coldStorageStatus'>) => void
}

export const AddWarehouseModal: React.FC<AddWarehouseModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Maharashtra')
  const [gstin, setGstin] = useState('')
  const [type, setType] = useState<'Owned' | '3PL' | 'Cold Chain'>('Owned')
  const [coldStorageEnabled, setColdStorageEnabled] = useState(false)
  const [managerName, setManagerName] = useState('')

  const states = ['Maharashtra', 'Tamil Nadu', 'Telangana', 'Karnataka', 'Haryana', 'Gujarat']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !address || !city || !gstin || !managerName) {
      alert('Please fill out all required fields.')
      return
    }

    // GSTIN format checker (simple regex)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstinRegex.test(gstin.toUpperCase())) {
      alert('Invalid GSTIN format. Expected format (e.g. 27AABCW1842A1Z5)')
      return
    }

    onAdd({
      name,
      code: `WH-${city.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      address,
      city,
      state,
      location: `${city}, ${state}`,
      gstin: gstin.toUpperCase(),
      type,
      totalAreaSqFt: 100000,
      utilizationPercent: 0,
      zonesCount: 4,
      racksCount: 40,
      binsCount: 1200,
      coldStorageEnabled: type === 'Cold Chain' ? true : coldStorageEnabled,
      openAlertsCount: 0,
      status: 'Active',
      managerName,
      staffCount: 10
    })

    // Reset Form
    setName('')
    setAddress('')
    setCity('')
    setState('Maharashtra')
    setGstin('')
    setType('Owned')
    setColdStorageEnabled(false)
    setManagerName('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Logistics Facility">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Warehouse Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pune Logistics Depot"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Street Address *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Survey No 11, MIDC Zone"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>State *</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={styles.select}
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>GSTIN *</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="e.g. 27AABCW1842A1Z5"
            maxLength={15}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Facility Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className={styles.select}
            >
              <option value="Owned">Owned</option>
              <option value="3PL">3PL / Leased</option>
              <option value="Cold Chain">Cold Chain</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Facility Manager *</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Manager Name"
              required
              className={styles.input}
            />
          </div>
        </div>

        {type !== 'Cold Chain' && (
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="cold-storage-enabled"
              checked={coldStorageEnabled}
              onChange={(e) => setColdStorageEnabled(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor="cold-storage-enabled" className={styles.checkboxLabel}>
              Facility contains cold storage chambers
            </label>
          </div>
        )}

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Register Facility
          </button>
        </div>
      </form>
    </Modal>
  )
}
export default AddWarehouseModal
