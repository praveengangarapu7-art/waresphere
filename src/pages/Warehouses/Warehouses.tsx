import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Card } from '../../components/ui/Card/Card'
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader'
import { DonutChart, DonutChartSegment } from '../../components/charts/DonutChart/DonutChart'
import { WarehouseFilters } from './components/WarehouseFilters'
import { WarehouseCard } from './components/WarehouseCard'
import { AddWarehouseModal } from './components/AddWarehouseModal'
import { warehouseService } from '../../services/warehouseService'
import { Warehouse } from '../../types/warehouse'
import { Grid, List, Plus, MapPin, Percent, Layers, Bell, ChevronRight, CheckCircle2, Wrench, TrendingUp } from 'lucide-react'
import styles from './Warehouses.module.css'

// Same 75–85% "healthy" band already used by WarehouseCard / the list
// view's progress-bar coloring — reused here, not redefined, so the
// network-level view and the per-facility view always agree.
const isHealthyUtilization = (pct: number) => pct >= 75 && pct <= 85

export const Warehouses: React.FC = () => {
  const navigate = useNavigate()

  // State
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true)
      const data = await warehouseService.getWarehouses()
      setAllWarehouses(data)
      setLoading(false)
    }
    fetchWarehouses()
  }, [])

  // Add Warehouse Handler — persists via warehouseService.createWarehouse so
  // it survives navigation for the rest of the session, instead of only
  // ever existing in this component's local state.
  const handleAddWarehouse = async (newWh: Omit<Warehouse, 'id' | 'utilization' | 'accuracy' | 'openAlerts' | 'coldStorageStatus'>) => {
    const created = await warehouseService.createWarehouse({
      ...newWh,
      // Legacy compatibility mappings
      utilization: newWh.utilizationPercent,
      accuracy: 98.0,
      openAlerts: newWh.openAlertsCount,
      coldStorageStatus: 'Normal',
      location: `${newWh.city}, ${newWh.state}`
    })

    setAllWarehouses(prev => [created, ...prev])
    setIsAddModalOpen(false)
  }

  // Clear filters helper
  const handleClearFilters = () => {
    setSearch('')
    setSelectedState('all')
    setSelectedType('all')
    setSelectedStatus('all')
  }

  const hasActiveFilters = useMemo(() => {
    return search !== '' || selectedState !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
  }, [search, selectedState, selectedType, selectedStatus])

  // Filter logic
  const filteredWarehouses = useMemo(() => {
    let result = [...allWarehouses]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(w => 
        w.name.toLowerCase().includes(q) || 
        w.city.toLowerCase().includes(q)
      )
    }

    if (selectedState !== 'all') {
      result = result.filter(w => w.state === selectedState)
    }

    if (selectedType !== 'all') {
      result = result.filter(w => w.type === selectedType)
    }

    if (selectedStatus !== 'all') {
      result = result.filter(w => w.status === selectedStatus)
    }

    return result
  }, [allWarehouses, search, selectedState, selectedType, selectedStatus])

  // Stats Rollups (based on full unfiltered list)
  const totalWarehouses = allWarehouses.length
  
  const avgUtilization = useMemo(() => {
    if (allWarehouses.length === 0) return 0
    const sum = allWarehouses.reduce((acc, w) => acc + w.utilizationPercent, 0)
    return Math.round(sum / allWarehouses.length)
  }, [allWarehouses])

  const totalBins = useMemo(() => {
    return allWarehouses.reduce((acc, w) => acc + w.binsCount, 0)
  }, [allWarehouses])

  const totalAlerts = useMemo(() => {
    return allWarehouses.reduce((acc, w) => acc + w.openAlertsCount, 0)
  }, [allWarehouses])

  // Network health — utilization-band breakdown, computed from the same
  // full warehouse list already fetched above (no new data/service calls).
  const utilizationBands: DonutChartSegment[] = useMemo(() => {
    const healthy = allWarehouses.filter(w => isHealthyUtilization(w.utilizationPercent)).length
    const underUtilized = allWarehouses.filter(w => w.utilizationPercent < 75).length
    const overCapacity = allWarehouses.filter(w => w.utilizationPercent > 85).length
    return [
      { label: 'Healthy', value: healthy, color: 'var(--color-status-success)' },
      { label: 'Under-utilized', value: underUtilized, color: 'var(--color-status-draft)' },
      { label: 'Over Capacity', value: overCapacity, color: 'var(--color-status-pending)' }
    ].filter(seg => seg.value > 0)
  }, [allWarehouses])

  // Needs Attention — facilities under maintenance, carrying open alerts,
  // or over capacity. Real conditions from real fields already on the
  // Warehouse type; nothing invented.
  const warehousesNeedingAttention = useMemo(() => {
    return allWarehouses.filter(w =>
      w.status === 'Under Maintenance' || w.openAlertsCount > 0 || w.utilizationPercent > 85
    )
  }, [allWarehouses])

  const handleRowClick = (id: string) => {
    navigate(`/warehouses/${id}`)
  }

  if (loading) {
    return <div className={styles.loadingState}>Loading facility master list...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Warehouse Network"
        title="Warehouse Directory"
        description="Unified oversight of physical logistics structures, capacities, and active nodes."
        actions={
          <div className={styles.headerActions}>
            {/* View Mode Toggle Switch */}
            <div className={styles.toggleGroup}>
              <button
                onClick={() => setViewMode('grid')}
                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
                aria-label="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.activeToggle : ''}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>

            <button onClick={() => setIsAddModalOpen(true)} className={styles.btnPrimary}>
              <Plus size={16} />
              <span>Add Warehouse</span>
            </button>
          </div>
        }
      />

      {/* Summary Stats Strip */}
      <div className={styles.statsStrip}>
        <StatCard
          title="Total Sites"
          value={totalWarehouses}
          icon={<MapPin size={18} />}
        />
        <StatCard
          title="Average Utilization"
          value={`${avgUtilization}%`}
          icon={<Percent size={18} />}
          variant={avgUtilization > 85 ? 'warning' : 'default'}
        />
        <StatCard
          title="Bins Monitored"
          value={totalBins.toLocaleString('en-IN')}
          icon={<Layers size={18} />}
        />
        <StatCard
          title="Total Open Alerts"
          value={totalAlerts}
          icon={<Bell size={18} />}
          variant={totalAlerts > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Network Health — "where is my network healthy, constrained, or
          requiring attention?" answered from the same warehouse list used
          everywhere else on this page. */}
      <div>
        <SectionHeader eyebrow="Network Health" title="Where your network needs attention" />
        <div className={styles.healthGrid}>
          <Card interactive={false} className={styles.healthCard}>
            <DonutChart data={utilizationBands} centerValue={totalWarehouses} centerLabel="Sites" />
          </Card>

          <Card interactive={false} className={styles.attentionCard}>
            {warehousesNeedingAttention.length === 0 ? (
              <div className={styles.allClear}>
                <CheckCircle2 size={20} className={styles.allClearIcon} />
                <div>
                  <strong>All facilities operating normally</strong>
                  <p>No open alerts, maintenance flags, or over-capacity sites.</p>
                </div>
              </div>
            ) : (
              <ul className={styles.attentionList}>
                {warehousesNeedingAttention.map(w => (
                  <li key={w.id}>
                    <button className={styles.attentionRow} onClick={() => handleRowClick(w.id)}>
                      <div className={styles.attentionInfo}>
                        <strong>{w.name}</strong>
                        <span>{w.city}, {w.state}</span>
                      </div>
                      <div className={styles.attentionReasons}>
                        {w.status === 'Under Maintenance' && (
                          <span className={styles.reasonTag}><Wrench size={11} /> Maintenance</span>
                        )}
                        {w.utilizationPercent > 85 && (
                          <span className={`${styles.reasonTag} ${styles.reasonWarning}`}><TrendingUp size={11} /> {w.utilizationPercent}% capacity</span>
                        )}
                        {w.openAlertsCount > 0 && (
                          <span className={`${styles.reasonTag} ${styles.reasonDanger}`}><Bell size={11} /> {w.openAlertsCount} alerts</span>
                        )}
                      </div>
                      <ChevronRight size={16} className={styles.attentionChevron} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Filter Options */}
      <WarehouseFilters
        search={search}
        setSearch={setSearch}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onClear={handleClearFilters}
        filteredCount={filteredWarehouses.length}
        totalCount={allWarehouses.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main content viewport */}
      {filteredWarehouses.length === 0 ? (
        <EmptyState
          title="No Logistics Nodes Found"
          description="No physical facilities matched your active filter selections. Clear filters to scan all warehouses."
          action={
            <button onClick={handleClearFilters} className={styles.btnPrimary}>
              Clear Active Filters
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {filteredWarehouses.map(wh => (
            <WarehouseCard key={wh.id} warehouse={wh} />
          ))}
        </div>
      ) : (
        <div className={styles.tableCard}>
          <Table headers={['Warehouse Name', 'Code', 'City / State', 'Type', 'Utilization', 'Zones', 'Alerts', 'Status']}>
            {filteredWarehouses.map(wh => (
              <tr key={wh.id} onClick={() => handleRowClick(wh.id)} className={styles.clickableRow}>
                <td><strong>{wh.name}</strong></td>
                <td><code>{wh.code}</code></td>
                <td>{wh.city}, {wh.state}</td>
                <td><Badge variant={wh.type === 'Cold Chain' ? 'info' : 'secondary'}>{wh.type}</Badge></td>
                <td>
                  <div className={styles.progressCell}>
                    <strong>{wh.utilizationPercent}%</strong>
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${wh.utilizationPercent >= 75 && wh.utilizationPercent <= 85 ? styles.fillHealthy : styles.fillWarning}`} 
                        style={{ width: `${wh.utilizationPercent}%` }} 
                      />
                    </div>
                  </div>
                </td>
                <td>{wh.zonesCount} Zones</td>
                <td>
                  {wh.openAlertsCount > 0 ? (
                    <span className={styles.alertBadge}>{wh.openAlertsCount} alerts</span>
                  ) : (
                    <span className={styles.successText}>Clear</span>
                  )}
                </td>
                <td>
                  <span className={`${styles.statusDot} ${wh.status === 'Active' ? styles.activeDot : styles.maintenanceDot}`} />{' '}
                  <span className={styles.statusLabel}>{wh.status}</span>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Add Warehouse Dialog Form */}
      <AddWarehouseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWarehouse}
      />
    </div>
  )
}

export default Warehouses
