import React, { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { ColdStorageZoneCard } from '../../components/domain/ColdStorageZoneCard/ColdStorageZoneCard'
import {
  ZoneDetailPanel,
  AlertHistoryTab,
  SensorHealthTab,
  MaintenanceTab,
  ComplianceEnergyTab,
  ScheduleMaintenanceModal
} from './components'
import { coldStorageService } from '../../services/coldStorageService'
import { ColdStorageZone, DeviationAlert, MaintenanceItem } from '../../types/coldStorage'
import { ShieldCheck, Thermometer, BatteryWarning, AlertOctagon } from 'lucide-react'
import styles from './ColdStorage.module.css'

export const ColdStorage: React.FC = () => {
  // Telemetry state
  const [zones, setZones] = useState<ColdStorageZone[]>([])
  const [alerts, setAlerts] = useState<DeviationAlert[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([])
  const [loading, setLoading] = useState(true)

  // Scope selectors
  const [scope, setScope] = useState('all')

  // Modals & Panels toggles
  const [selectedZone, setSelectedZone] = useState<ColdStorageZone | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [z, a, m] = await Promise.all([
      coldStorageService.getColdStorageZones(),
      coldStorageService.getDeviationAlerts(),
      coldStorageService.getMaintenanceItems()
    ])
    setZones(z)
    setAlerts(a)
    setMaintenance(m)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create maintenance callback
  const handleAddMaintenance = async (newMaint: Omit<MaintenanceItem, 'id' | 'status'>) => {
    const created = await coldStorageService.createMaintenanceItem(newMaint)
    setMaintenance(prev => [created, ...prev])
    setIsScheduleOpen(false)
  }

  // Filter zones by warehouse scope
  const filteredZones = useMemo(() => {
    if (scope === 'all') return zones
    return zones.filter(z => z.warehouseId === scope)
  }, [zones, scope])

  // Stat summary counts
  const monitoredZones = zones.length
  const activeDeviations = alerts.filter(a => a.status === 'Ongoing').length
  const offlineSensors = zones.flatMap(z => z.sensors).filter(s => s.connectivity === 'Offline').length
  const lowBatteryCount = zones.flatMap(z => z.sensors).filter(s => s.batteryPercent < 20).length

  // Filter list of warehouses that contain cold-chain zones
  const coldWarehouses = useMemo(() => {
    const map = new Map<string, string>()
    zones.forEach(z => {
      map.set(z.warehouseId, z.warehouseName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [zones])

  const tabsList = [
    { id: 'live', label: 'Live Telemetry' },
    { id: 'alerts', label: 'Alert History' },
    { id: 'health', label: 'IoT Sensors' },
    { id: 'maint', label: 'Equipment Maintenance' },
    { id: 'compliance', label: 'Compliance & Energy' }
  ]

  const [activeTab, setActiveTab] = useState('live')

  const handleCardClick = (zone: ColdStorageZone) => {
    setSelectedZone(zone)
    setIsDetailOpen(true)
  }

  if (loading) {
    return <div className={styles.loadingState}>Connecting to sensor gateway telemetry...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Cold Storage & IoT Console"
        description="Real-time telemetry feeds, active deviation escalations, sensor battery levels, and preventive service schedules."
        actions={
          <div className={styles.headerScope}>
            <label className={styles.scopeLabel}>Active Node:</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className={styles.scopeSelect}
            >
              <option value="all">All Cold-Chain Facility Nodes</option>
              {coldWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Environmental KPI Stats */}
      <div className={styles.kpiGrid}>
        <StatCard
          title="Zones Monitored"
          value={monitoredZones}
          icon={<ShieldCheck size={18} />}
        />
        <StatCard
          title="Average Compliance Rate"
          value="97.8%"
          icon={<Thermometer size={18} />}
        />
        <StatCard
          title="Active Temperature Deviations"
          value={activeDeviations}
          variant={activeDeviations > 0 ? 'danger' : 'default'}
          icon={<AlertOctagon size={18} />}
        />
        <StatCard
          title="IoT Device Anomalies"
          value={`${offlineSensors} offline / ${lowBatteryCount} low batt`}
          variant={offlineSensors > 0 || lowBatteryCount > 0 ? 'warning' : 'default'}
          icon={<BatteryWarning size={18} />}
        />
      </div>

      {/* Tabs viewport */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'live' && (
          <div className={styles.liveGrid}>
            {filteredZones.map(zone => (
              <ColdStorageZoneCard
                key={zone.id}
                zone={zone}
                onClick={() => handleCardClick(zone)}
              />
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertHistoryTab alerts={alerts} />
        )}

        {activeTab === 'health' && (
          <SensorHealthTab zones={zones} onRefresh={fetchData} />
        )}

        {activeTab === 'maint' && (
          <MaintenanceTab items={maintenance} onOpenSchedule={() => setIsScheduleOpen(true)} />
        )}

        {activeTab === 'compliance' && (
          <ComplianceEnergyTab zones={zones} />
        )}
      </div>

      {/* Slide-in Detail panel */}
      <ZoneDetailPanel
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        zone={selectedZone}
      />

      {/* Schedule Maintenance modal */}
      <ScheduleMaintenanceModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onAdd={handleAddMaintenance}
      />
    </div>
  )
}

export default ColdStorage
