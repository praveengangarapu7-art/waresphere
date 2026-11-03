import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { Badge } from '../../components/ui/Badge/Badge'
import { Modal } from '../../components/ui/Modal/Modal'
import { AIInsightCard } from '../../components/ui/AIInsightCard/AIInsightCard'
import { warehouseService } from '../../services/warehouseService'
import { mockZones } from '../../mock-data/zones'
import { Warehouse } from '../../types/warehouse'
import { Zone } from '../../mock-data/zones'
import {
  FloorMapTab,
  ZonesBinsTab,
  InventoryHereTab,
  ColdStorageTab,
  TeamTab
} from './components'
import { ChevronRight, Settings, Bell, MapPin, Percent, Layers, Users } from 'lucide-react'
import styles from './WarehouseDetail.module.css'

export const WarehouseDetail: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const { activeRole } = useRole()

  // State
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('floormap')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Prefilled Edit Form State
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editState, setEditState] = useState('Maharashtra')
  const [editGstin, setEditGstin] = useState('')
  const [editType, setEditType] = useState<'Owned' | '3PL' | 'Cold Chain'>('Owned')
  const [editManager, setEditManager] = useState('')

  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      if (warehouseId) {
        setLoading(true)
        const whs = await warehouseService.getWarehouses()
        const found = whs.find(w => w.id === warehouseId)
        if (found) {
          setWarehouse(found)
          // Filter zones belonging to this warehouse
          setZones(mockZones.filter(z => z.warehouseId === warehouseId))

          // Initialize Edit Form Fields
          setEditName(found.name)
          setEditAddress(found.address)
          setEditCity(found.city)
          setEditState(found.state)
          setEditGstin(found.gstin)
          setEditType(found.type)
          setEditManager(found.managerName)
        }
        setLoading(false)
      }
    }
    fetchWarehouseDetails()
  }, [warehouseId])

  if (loading) {
    return <div className={styles.loadingState}>Loading facility blueprint...</div>
  }

  if (!warehouse) {
    return (
      <div className={styles.notFound}>
        <h3>Warehouse Facility Not Found</h3>
        <p>The requested facility identifier does not exist in the operational registry.</p>
        <Link to="/warehouses" className={styles.backLink}>Back to Warehouse Directory</Link>
      </div>
    )
  }

  // Submit edit handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editName || !editAddress || !editCity || !editGstin || !editManager || !warehouse) {
      alert('Please fill out all required fields.')
      return
    }

    const updated: Warehouse = {
      ...warehouse,
      name: editName,
      address: editAddress,
      city: editCity,
      state: editState,
      gstin: editGstin.toUpperCase(),
      type: editType,
      managerName: editManager,
      coldStorageEnabled: editType === 'Cold Chain' ? true : warehouse.coldStorageEnabled,
      location: `${editCity}, ${editState}`
    }

    // Persists via warehouseService.updateWarehouse so the edit survives
    // navigation for the rest of the session, instead of only ever
    // existing in this component's local state.
    await warehouseService.updateWarehouse(updated)
    setWarehouse(updated)

    setIsEditModalOpen(false)
  }

  // Filter tabs - hide Cold Storage tab if cold storage is not enabled
  const baseTabs = [
    { id: 'floormap', label: 'Interactive Layout' },
    { id: 'zones', label: 'Zones & Bins' },
    { id: 'inventory', label: 'Inventory Stored' }
  ]

  if (warehouse.coldStorageEnabled) {
    baseTabs.push({ id: 'coldstorage', label: 'Cold Storage & IoT' })
  }

  baseTabs.push({ id: 'team', label: 'Roster & Team' })

  const isHealthyUtilization = warehouse.utilizationPercent >= 75 && warehouse.utilizationPercent <= 85
  const isAuditor = activeRole === 'External Auditor'

  // Zones running hot right now — reuses the same >80% threshold FloorMapTab
  // and the Warehouse Directory's own attention list already use.
  const zonesNearCapacity = zones.filter(z => z.capacityPercent > 80)

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/warehouses" className={styles.crumbLink}>Warehouses</Link>
        <ChevronRight size={14} />
        <span className={styles.crumbCurrent}>{warehouse.name}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Facility Overview</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{warehouse.name}</h1>
            <Badge variant={warehouse.type === 'Cold Chain' ? 'info' : 'primary'}>
              {warehouse.type}
            </Badge>
          </div>
          <div className={styles.subtitleRow}>
            <span className={`${styles.statusDot} ${warehouse.status === 'Active' ? styles.active : styles.maintenance}`} />
            <span className={styles.subtitleText}>
              {warehouse.code} · {warehouse.city}, {warehouse.state} · Manager: <strong>{warehouse.managerName}</strong>
            </span>
          </div>
        </div>

        {!isAuditor && (
          <div className={styles.actions}>
            <button onClick={() => setIsEditModalOpen(true)} className={styles.btnSecondary}>
              <Settings size={16} />
              <span>Edit Warehouse</span>
            </button>
            <button onClick={() => alert('Viewing system exception logs filtered by warehouse...')} className={styles.btnPrimary}>
              <Bell size={16} />
              <span>View Alerts</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className={styles.summaryStrip}>
        <StatCard
          title="Utilization"
          value={`${warehouse.utilizationPercent}%`}
          variant={isHealthyUtilization ? 'default' : 'warning'}
          icon={<Percent size={18} />}
          description={isHealthyUtilization ? 'Healthy range (75-85%)' : 'Outside optimal target'}
        />
        <StatCard
          title="Total Zones"
          value={warehouse.zonesCount}
          icon={<Layers size={18} />}
        />
        <StatCard
          title="Total Bins"
          value={warehouse.binsCount.toLocaleString('en-IN')}
          icon={<MapPin size={18} />}
        />
        <StatCard
          title="Open Alerts"
          value={warehouse.openAlertsCount}
          variant={warehouse.openAlertsCount > 0 ? 'danger' : 'default'}
          icon={<Bell size={18} />}
        />
        <StatCard
          title="Floor Headcount"
          value={warehouse.staffCount}
          icon={<Users size={18} />}
        />
      </div>

      {/* Facility Pulse — computed from the zones already loaded for this facility */}
      {zonesNearCapacity.length > 0 ? (
        <AIInsightCard
          severity="warning"
          label="Capacity Watch"
          title={`${zonesNearCapacity.length} zone${zonesNearCapacity.length > 1 ? 's' : ''} approaching capacity`}
          description={`${zonesNearCapacity.map(z => `${z.name} (${z.capacityPercent}%)`).join(', ')}. Review the interactive layout to plan reallocation.`}
          actionLabel="View Floor Map"
          onAction={() => setActiveTab('floormap')}
        />
      ) : (
        <AIInsightCard
          severity="success"
          label="Facility Status"
          title="All zones operating within healthy capacity"
          description="No zones at this facility are currently flagged for overcapacity."
        />
      )}

      {/* Tabbed content split */}
      <div className={styles.tabsSection}>
        <Tabs tabs={baseTabs} activeTab={activeTab} onChange={setActiveTab} />
        
        <div className={styles.tabContentArea}>
          {activeTab === 'floormap' && <FloorMapTab zones={zones} />}
          {activeTab === 'zones' && <ZonesBinsTab zones={zones} />}
          {activeTab === 'inventory' && <InventoryHereTab warehouseId={warehouse.id} />}
          {activeTab === 'coldstorage' && <ColdStorageTab warehouseId={warehouse.id} zones={zones} />}
          {activeTab === 'team' && <TeamTab managerName={warehouse.managerName} staffCount={warehouse.staffCount} />}
        </div>
      </div>

      {/* Edit Warehouse Modal Dialog Form */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modify Facility Metadata"
      >
        <form onSubmit={handleEditSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Warehouse Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Street Address *</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>City *</label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>State *</label>
              <select
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                className={styles.select}
              >
                {['Maharashtra', 'Tamil Nadu', 'Telangana', 'Karnataka', 'Haryana', 'Gujarat'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>GSTIN *</label>
            <input
              type="text"
              value={editGstin}
              onChange={(e) => setEditGstin(e.target.value)}
              maxLength={15}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Facility Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
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
                value={editManager}
                onChange={(e) => setEditManager(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className={styles.btnSecondary}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Save Facility Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default WarehouseDetail
