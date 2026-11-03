import React, { useState, useEffect } from 'react'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Modal } from '../../../components/ui/Modal/Modal'
import { HandheldDevice } from '../../../mock-data/handheldDevices'
import { deviceService } from '../../../services/deviceService'
import { mockWarehouses } from '../../../mock-data/warehouses'
import {
  Tablet, Wifi, WifiOff, Battery, BatteryLow, AlertTriangle,
  Plus, Filter, RefreshCw, CheckCircle,
} from 'lucide-react'
import styles from './HandheldDevicesTab.module.css'

const MODELS = ['Zebra TC21', 'Zebra MC3300', 'Honeywell CT45', 'Honeywell CK65', 'Zebra TC72'] as const

type DeviceFilter = 'all' | 'offline' | 'low-battery'

export const HandheldDevicesTab: React.FC = () => {
  const [devices, setDevices]           = useState<HandheldDevice[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState<DeviceFilter>('all')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true)
      const data = await deviceService.getDevices()
      setDevices(data)
      setLoading(false)
    }
    fetchDevices()
  }, [])

  // Register form state
  const [newDeviceId,    setNewDeviceId]    = useState('')
  const [newModel,       setNewModel]       = useState<HandheldDevice['model']>('Zebra TC21')
  const [newAssignedTo,  setNewAssignedTo]  = useState('')
  const [newWarehouseId, setNewWarehouseId] = useState(mockWarehouses[0]?.id || '')

  const offlineCount    = devices.filter(d => d.connectivity === 'Offline').length
  const lowBatteryCount = devices.filter(d => d.batteryPercent < 20).length

  const filteredDevices = devices.filter(d => {
    if (filter === 'offline')     return d.connectivity === 'Offline'
    if (filter === 'low-battery') return d.batteryPercent < 20
    return true
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeviceId.trim() || !newAssignedTo.trim()) return
    const created = await deviceService.registerDevice({
      deviceId: newDeviceId.trim(),
      assignedTo: newAssignedTo.trim(),
      model: newModel,
      batteryPercent: 100,
      connectivity: 'Online',
      lastSync: new Date().toISOString(),
      offlineQueueCount: 0,
      warehouseId: newWarehouseId,
    })
    setDevices(prev => [created, ...prev])
    setIsRegisterOpen(false)
    setNewDeviceId('')
    setNewAssignedTo('')
  }

  const getBatteryIcon = (pct: number) => {
    if (pct < 20) return <BatteryLow size={14} className={styles.batteryLow} />
    return <Battery size={14} className={styles.batteryOk} />
  }

  const getBatteryBadge = (pct: number) => {
    if (pct < 10) return <Badge variant="danger">{pct}%</Badge>
    if (pct < 20) return <Badge variant="warning">{pct}%</Badge>
    return <span className={styles.batteryPct}>{pct}%</span>
  }

  const formatLastSync = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr  = Math.floor(diffMin / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24)  return `${diffHr}h ago`
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const getWarehouseName = (id: string) =>
    mockWarehouses.find(w => w.id === id)?.name?.split(' ')[0] || id

  if (loading) {
    return <div className={styles.loadingState}>Loading device fleet...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Handheld Scanner Fleet</h3>
          <p className={styles.subtitle}>{devices.length} registered devices · {offlineCount} offline · {lowBatteryCount} low battery</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setIsRegisterOpen(true)}>
          <Plus size={15} /> Register Device
        </button>
      </div>

      {/* Filter chips */}
      <div className={styles.filterRow}>
        <Filter size={13} className={styles.filterIcon} />
        {[
          { key: 'all',         label: `All (${devices.length})` },
          { key: 'offline',     label: `Offline (${offlineCount})`,         icon: <WifiOff size={11} /> },
          { key: 'low-battery', label: `Low Battery (${lowBatteryCount})`,  icon: <BatteryLow size={11} /> },
        ].map(f => (
          <button
            key={f.key}
            className={`${styles.filterChip} ${filter === f.key ? styles.filterChipActive : ''}`}
            onClick={() => setFilter(f.key as DeviceFilter)}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert banners */}
      {offlineCount > 0 && (
        <div className={styles.alertBanner}>
          <WifiOff size={14} />
          <span>
            <strong>{offlineCount} device{offlineCount > 1 ? 's' : ''}</strong> offline.
            Pending scans will sync automatically when connectivity is restored.
          </span>
        </div>
      )}
      {lowBatteryCount > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertAmber}`}>
          <AlertTriangle size={14} />
          <span>
            <strong>{lowBatteryCount} device{lowBatteryCount > 1 ? 's' : ''}</strong> below 20% battery.
            Return to charging dock before next shift.
          </span>
        </div>
      )}

      {/* Device table */}
      <div className={styles.tableCard}>
        <Table headers={['Device ID', 'Model', 'Assigned To', 'Warehouse', 'Battery', 'Connectivity', 'Last Sync', 'Offline Queue']}>
          {filteredDevices.map(d => (
            <tr key={d.id} className={d.connectivity === 'Offline' ? styles.offlineRow : ''}>
              <td>
                <div className={styles.deviceIdCell}>
                  <Tablet size={13} className={styles.deviceIcon} />
                  <code className={styles.deviceCode}>{d.deviceId}</code>
                </div>
              </td>
              <td className={styles.modelCell}>{d.model}</td>
              <td>{d.assignedTo}</td>
              <td className={styles.warehouseCell}>{getWarehouseName(d.warehouseId)}</td>
              <td>
                <div className={styles.batteryCell}>
                  {getBatteryIcon(d.batteryPercent)}
                  {getBatteryBadge(d.batteryPercent)}
                </div>
              </td>
              <td>
                {d.connectivity === 'Online' ? (
                  <span className={styles.onlineBadge}>
                    <Wifi size={11} />
                    Online
                  </span>
                ) : (
                  <span className={styles.offlineBadge}>
                    <WifiOff size={11} />
                    Offline
                  </span>
                )}
              </td>
              <td>
                <div className={styles.syncCell}>
                  <RefreshCw size={11} />
                  {formatLastSync(d.lastSync)}
                </div>
              </td>
              <td>
                {d.offlineQueueCount > 0 ? (
                  <span className={styles.queueBadge}>{d.offlineQueueCount} pending</span>
                ) : (
                  <span className={styles.syncedBadge}>
                    <CheckCircle size={11} /> Synced
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Register device modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register Handheld Device">
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Device ID *</label>
            <input
              className={styles.input}
              value={newDeviceId}
              onChange={e => setNewDeviceId(e.target.value)}
              placeholder="e.g. ZBR-TC21-004"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Device Model *</label>
            <select
              className={styles.select}
              value={newModel}
              onChange={e => setNewModel(e.target.value as HandheldDevice['model'])}
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Assigned To *</label>
            <input
              className={styles.input}
              value={newAssignedTo}
              onChange={e => setNewAssignedTo(e.target.value)}
              placeholder="Staff member name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse *</label>
            <select
              className={styles.select}
              value={newWarehouseId}
              onChange={e => setNewWarehouseId(e.target.value)}
            >
              {mockWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={() => setIsRegisterOpen(false)} className={styles.btnSecondary}>Cancel</button>
            <button type="submit" className={styles.btnPrimary}>
              <Plus size={14} /> Register Device
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default HandheldDevicesTab
