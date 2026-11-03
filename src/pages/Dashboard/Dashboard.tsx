import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import { useAuth } from '../../hooks/useAuth'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { KpiCard } from '../../components/ui/KpiCard/KpiCard'
import { Card } from '../../components/ui/Card/Card'
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader'
import { AIInsightCard } from '../../components/ui/AIInsightCard/AIInsightCard'
import { Table } from '../../components/ui/Table/Table'
import { AlertBanner } from '../../components/domain/AlertBanner/AlertBanner'
import { LineChartCard } from '../../components/charts/LineChartCard/LineChartCard'
import { BarChartCard } from '../../components/charts/BarChartCard/BarChartCard'
import { reportService } from '../../services/reportService'
import { warehouseService } from '../../services/warehouseService'
import { coldStorageService } from '../../services/coldStorageService'
import { inventoryService } from '../../services/inventoryService'
import { inboundService } from '../../services/inboundService'
import { outboundService } from '../../services/outboundService'
import { movementService } from '../../services/movementService'
import { Warehouse } from '../../types/warehouse'
import { KPIValues } from '../../types/kpi'
import { SKU } from '../../types/sku'
import { InboundOrder } from '../../types/inboundOrder'
import { OutboundOrder } from '../../types/outboundOrder'
import { StockMovement } from '../../types/movement'
import {
  AlertOctagon,
  TrendingUp,
  Cpu,
  Scale,
  Package,
  Wallet,
  Download,
  Upload,
  AlertTriangle,
  Warehouse as WarehouseIcon
} from 'lucide-react'
import styles from './Dashboard.module.css'

export const Dashboard: React.FC = () => {
  const { activeRole } = useRole()
  const { user } = useAuth()
  const navigate = useNavigate()

  // State
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [kpis, setKpis] = useState<KPIValues[]>([])
  const [coldReadings, setColdReadings] = useState<any[]>([])
  const [skus, setSkus] = useState<SKU[]>([])
  const [inboundOrders, setInboundOrders] = useState<InboundOrder[]>([])
  const [outboundOrders, setOutboundOrders] = useState<OutboundOrder[]>([])
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Enforce warehouse scope for Warehouse Manager
  useEffect(() => {
    if (activeRole === 'Warehouse Manager') {
      setSelectedWarehouse('wh-mum') // Lock to Mumbai
    } else {
      setSelectedWarehouse('all')
    }
  }, [activeRole])

  // Fetch data — existing warehouse/KPI/cold-storage calls unchanged;
  // inventory/inbound/outbound/movement calls added (all pre-existing,
  // already-used-elsewhere services) to power the command-center summary
  // strip and AI insight cards below with real data instead of inventing
  // new numbers.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [whs, fetchedKpis, readings, skuList, inbound, outbound, movements] = await Promise.all([
        warehouseService.getWarehouses(),
        reportService.getKpis(selectedWarehouse),
        coldStorageService.getReadings(),
        inventoryService.getSKUs(),
        inboundService.getInboundOrders(),
        outboundService.getOutboundOrders(),
        movementService.getMovements()
      ])
      setWarehouses(whs)
      setKpis(fetchedKpis)
      setColdReadings(readings)
      setSkus(skuList)
      setInboundOrders(inbound)
      setOutboundOrders(outbound)
      setRecentMovements(movements.slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [selectedWarehouse])

  // Helpers
  const getBarChartData = () => {
    if (selectedWarehouse !== 'all') {
      // Return 6-week historical utilization trend for the selected warehouse
      return [
        { label: 'Wk 7', value: 68 },
        { label: 'Wk 8', value: 70 },
        { label: 'Wk 9', value: 72 },
        { label: 'Wk 10', value: 71 },
        { label: 'Wk 11', value: 74 },
        { label: 'Wk 12', value: Math.round(warehouses.find(w => w.id === selectedWarehouse)?.utilization || 70) }
      ]
    }
    // Return all warehouses comparison
    return warehouses.map(w => ({
      label: w.name.split(' ')[0], // First word (Mumbai, NCR, etc.)
      value: w.utilization
    })).sort((a, b) => b.value - a.value)
  }

  const handleWarehouseRowClick = (id: string) => {
    if (activeRole !== 'External Auditor') {
      navigate(`/warehouses/${id}`)
    }
  }

  // Task feed for Warehouse Staff
  const staffTasks = [
    { id: 't-1', task: 'Putaway: Batch #CVX0991 (Covaxin)', zone: 'Cold Zone A', priority: 'High', status: 'Pending' },
    { id: 't-2', task: 'Picking Order: ORD-OUT-9911 Item #3', zone: 'Dry Zone B', priority: 'High', status: 'In Progress' },
    { id: 't-3', task: 'Cycle Count: Bin High-Rack-C4', zone: 'High-Rack', priority: 'Medium', status: 'Scheduled' },
    { id: 't-4', task: 'Quality Verification: Isopropyl Alcohol drum seal', zone: 'Hazardous Vault', priority: 'Low', status: 'Pending' }
  ]

  // Mock Alerts Feed (Capped at 5 entries) — unchanged from the existing
  // implementation.
  const mockAlerts = [
    { type: 'cold-storage' as const, message: 'Temperature breach in Hyderabad Vaccines Deep-Freeze (-12.4°C / Target -18°C)', timestamp: '12 min ago', severity: 'critical' as const },
    { type: 'low-stock' as const, message: 'Stock levels of Paracetamol 500mg in Pune fell below reorder threshold (450 left)', timestamp: '34 min ago', severity: 'warning' as const },
    { type: 'transfer' as const, message: 'Pending transfer approval: 200 boxes N95 Masks from NCR Hub to Bengaluru', timestamp: '1 hour ago', severity: 'info' as const },
    { type: 'cycle-count' as const, message: 'Cycle Count Variance > 3% detected in Bhiwandi Dry Storage Area (Zone B)', timestamp: '2 hours ago', severity: 'warning' as const },
    { type: 'cold-storage' as const, message: 'Minor humidity variation warning in NCR Cold Cell 1 (65% / Target 60%)', timestamp: '3 hours ago', severity: 'warning' as const }
  ]

  if (loading) {
    return <div className={styles.loadingState}>Refreshing terminal metrics...</div>
  }

  // Filter components depending on Role
  const isStaff = activeRole === 'Warehouse Staff'
  const isQuality = activeRole === 'Quality Inspector'
  const isFinance = activeRole === 'Finance/Compliance'
  const isIT = activeRole === 'IT Admin'
  const isAuditor = activeRole === 'External Auditor'

  // Filter KPI cards to prioritize role specific parameters
  const getFilteredKPIs = () => {
    if (isQuality) {
      // Prioritize Cold Chain, Picking Accuracy, and Inventory Accuracy
      return kpis.filter(k => ['kpi-cold-chain', 'kpi-picking', 'kpi-accuracy'].includes(k.id))
    }
    if (isFinance) {
      // Prioritize Shrinkage, Warehouse Utilization, and OTIF
      return kpis.filter(k => ['kpi-shrinkage', 'kpi-utilization', 'kpi-otif'].includes(k.id))
    }
    return kpis.slice(0, 4) // Standard metrics row (top 4)
  }

  // ── Command-center summary strip — all computed from the same real,
  // already-fetched data every other page in the app uses (SKU ledger,
  // inbound/outbound order lists, warehouse list), never invented. ──────────
  const inventoryValue = skus.reduce((sum, s) => sum + s.totalValue, 0)
  const lowStockCount = skus.filter(s => s.status === 'Low Stock' || s.status === 'Out of Stock').length
  const activeInboundCount = inboundOrders.filter(o => o.status !== 'Completed').length
  const activeOutboundCount = outboundOrders.filter(o => o.status !== 'Delivered').length
  const delayedInboundCount = inboundOrders.filter(o => o.status === 'On Hold').length
  const avgUtilization = warehouses.length
    ? Math.round(warehouses.reduce((sum, w) => sum + w.utilization, 0) / warehouses.length)
    : 0

  const formatCr = (value: number) => `₹${(value / 10000000).toFixed(2)} Cr`

  return (
    <div className={styles.container}>
      {/* ── Hero: Warehouse Intelligence ──────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <span className={styles.heroEyebrow}>Warehouse Intelligence</span>
            <h1 className={styles.heroTitle}>Know what is happening across your warehouse network.</h1>
            <p className={styles.heroSubtitle}>
              {activeRole} view — {user?.companyName || 'WareSphere Logistics'}
            </p>
          </div>
          <div className={styles.aiStatus}>
            <span className={styles.aiStatusDot} />
            <span className={styles.aiStatusLabel}>AI SYSTEM</span>
            <span className={styles.aiStatusValue}>Operational</span>
          </div>
        </div>

        {/* Warehouse Scope Selector — unchanged logic */}
        {!isStaff && (
          <div className={styles.scopeSelector}>
            <label htmlFor="wh-scope" className={styles.scopeLabel}>Facility Scope:</label>
            <select
              id="wh-scope"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              disabled={activeRole === 'Warehouse Manager'}
              className={styles.select}
            >
              {activeRole !== 'Warehouse Manager' && <option value="all">All Warehouses (India)</option>}
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {activeRole === 'Warehouse Manager' && (
              <span className={styles.scopeHelper}>Scope locked to assigned facility</span>
            )}
          </div>
        )}

        <div className={styles.heroKpiRow}>
          <StatCard title="Inventory Value" value={formatCr(inventoryValue)} icon={<Wallet size={18} />} />
          <StatCard title="Total SKUs" value={skus.length} icon={<Package size={18} />} />
          <StatCard title="Active Inbound" value={activeInboundCount} icon={<Download size={18} />} />
          <StatCard title="Active Outbound" value={activeOutboundCount} icon={<Upload size={18} />} />
          <StatCard
            title="Low Stock / Out of Stock"
            value={lowStockCount}
            icon={<AlertTriangle size={18} />}
            variant={lowStockCount > 0 ? 'warning' : 'default'}
          />
          <StatCard title="Avg. Warehouse Capacity" value={`${avgUtilization}%`} icon={<WarehouseIcon size={18} />} />
        </div>
      </div>

      {/* 1. TASK VIEW (WAREHOUSE STAFF ONLY) — unchanged */}
      {isStaff ? (
        <div className={styles.staffGrid}>
          <SectionHeader eyebrow="Today" title="Today's Work Orders" />
          <Table headers={['Task Detail', 'Target Location', 'Priority', 'Status']}>
            {staffTasks.map(t => (
              <tr key={t.id}>
                <td><strong>{t.task}</strong></td>
                <td>{t.zone}</td>
                <td>
                  <span className={`${styles.priorityBadge} ${styles[t.priority.toLowerCase()]}`}>
                    {t.priority}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${t.status.replace(' ', '').toLowerCase()}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      ) : (
        /* 2. ANALYTICAL EXECUTIVE VIEW */
        <>
          {/* AI Insights — replaces the old single hardcoded-narrative
              teaser with insight cards driven by the same real signals
              computed above (low stock, delayed inbound, capacity). */}
          {!isFinance && (
            <div>
              <SectionHeader eyebrow="AI Insights" title="What needs your attention" />
              <div className={styles.insightsGrid}>
                <AIInsightCard
                  severity={lowStockCount > 10 ? 'critical' : lowStockCount > 0 ? 'warning' : 'success'}
                  label={lowStockCount > 10 ? 'High Priority' : 'Stock Signal'}
                  title={`${lowStockCount} SKUs may face shortage`}
                  description="Across the network, these SKUs are at or below their reorder point."
                  actionLabel="View reorder recommendations"
                  onAction={isAuditor ? undefined : () => navigate('/ai-insights')}
                />
                <AIInsightCard
                  severity={delayedInboundCount > 0 ? 'warning' : 'success'}
                  label="Inbound"
                  title={`${delayedInboundCount} inbound shipments delayed`}
                  description="Orders currently on hold in the receiving pipeline."
                  actionLabel="View delayed inbound orders"
                  onAction={isAuditor ? undefined : () => navigate('/ai-insights')}
                />
                <AIInsightCard
                  severity={avgUtilization >= 85 ? 'critical' : avgUtilization >= 75 ? 'warning' : 'info'}
                  label="Capacity"
                  title={`Warehouse capacity at ${avgUtilization}%`}
                  description="Average utilization across all active facilities."
                  actionLabel="View capacity breakdown"
                  onAction={isAuditor ? undefined : () => navigate('/ai-insights')}
                />
              </div>
            </div>
          )}

          {/* KPI Summary Row — existing role-filtered operational metrics,
              unchanged logic, now under its own section header. */}
          <div>
            <SectionHeader eyebrow="Operational Performance" title="Key performance indicators" />
            <div className={styles.kpiRow}>
              {getFilteredKPIs().map(kpi => (
                <KpiCard
                  key={kpi.id}
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  trend={kpi.trend}
                  target={kpi.target}
                />
              ))}
            </div>
          </div>

          {/* Charts Row — unchanged data/components */}
          <div className={styles.chartsGrid}>
            <LineChartCard data={kpis.find(k => k.id === 'kpi-accuracy')?.history || []} />
            <BarChartCard
              title={selectedWarehouse === 'all' ? 'Utilization across facilities (%)' : 'Weekly Facility Utilization Trend (%)'}
              data={getBarChartData()}
              isSingleWarehouse={selectedWarehouse !== 'all'}
            />
          </div>

          {/* Cold Storage status strip — unchanged logic, restyled with Card */}
          <div className={styles.coldStorageStrip}>
            <SectionHeader eyebrow="Facilities" title="Active Cold Storage Zones" />
            <div className={styles.coldGrid}>
              {coldReadings.map(reading => (
                <Card
                  key={reading.id}
                  className={styles.coldCard}
                  onClick={() => !isAuditor && navigate('/cold-storage')}
                >
                  <div className={styles.coldCardHeader}>
                    <span className={styles.coldZoneName}>{reading.zoneName}</span>
                    <span className={`${styles.statusDot} ${styles[reading.status.toLowerCase()]}`} />
                  </div>
                  <div className={styles.coldMetrics}>
                    <div>
                      <span className={styles.metricLabel}>Temp</span>
                      <span className={styles.metricVal}>{reading.currentTemperature}°C</span>
                    </div>
                    <div>
                      <span className={styles.metricLabel}>Humidity</span>
                      <span className={styles.metricVal}>{reading.humidity}%</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className={styles.panelsGrid}>
            {/* Live Alerts panel */}
            <Card interactive={false} className={styles.alertsPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderTitle}>
                  <AlertOctagon size={16} className={styles.alertIcon} />
                  <h3>Active Alerts & Exceptions</h3>
                </div>
                <a href="#alerts" onClick={(e) => e.preventDefault()} className={styles.viewAll}>
                  View all alerts
                </a>
              </div>
              <div className={styles.alertsFeed}>
                {mockAlerts.map((alert, i) => (
                  <AlertBanner
                    key={i}
                    type={alert.type}
                    message={alert.message}
                    timestamp={alert.timestamp}
                    severity={alert.severity}
                  />
                ))}
              </div>
            </Card>

            {/* Warehouse breakdown table */}
            <Card interactive={false} className={styles.breakdownPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderTitle}>
                  <TrendingUp size={16} className={styles.analyticsIcon} />
                  <h3>Facility Utilization Breakdown</h3>
                </div>
              </div>
              <Table headers={['Warehouse Name', 'Location', 'Utilization', 'Accuracy', 'Alerts']}>
                {warehouses.map(wh => (
                  <tr key={wh.id} onClick={() => handleWarehouseRowClick(wh.id)}>
                    <td><strong>{wh.name}</strong></td>
                    <td>{wh.location.split(',')[0]}</td>
                    <td>
                      <div className={styles.progressCell}>
                        <span>{wh.utilization}%</span>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${wh.utilization}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>{wh.accuracy}%</td>
                    <td>
                      {wh.openAlerts > 0 ? (
                        <span className={styles.tableAlertBadge}>{wh.openAlerts} alerts</span>
                      ) : (
                        <span className={styles.tableSuccessBadge}>Clear</span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>

          {/* Recent Activity — real stock movements, newest first */}
          <div>
            <SectionHeader eyebrow="Network" title="Recent Activity" />
            <Card interactive={false} className={styles.activityPanel}>
              <Table headers={['Movement', 'Type', 'Warehouse', 'Requested By', 'When']}>
                {recentMovements.map(m => (
                  <tr key={m.id}>
                    <td><code>{m.movementNumber}</code></td>
                    <td>{m.type}</td>
                    <td>{warehouses.find(w => w.id === m.fromWarehouseId)?.name?.split(' ')[0] || '—'}</td>
                    <td>{m.requestedBy}</td>
                    <td className={styles.timestampCell}>{m.requestedAt}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          </div>

          {/* IT Admin Integration Card */}
          {isIT && (
            <Card interactive={false} className={styles.itStatusCard}>
              <div className={styles.itHeader}>
                <Cpu size={18} className={styles.itIcon} />
                <h3>IT Systems & Core Integrations</h3>
              </div>
              <div className={styles.itGrid}>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>Tally ERP Sync</span>
                  <span className={`${styles.itBadge} ${styles.good}`}>Operational</span>
                </div>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>GSTN Portal API Gateway</span>
                  <span className={`${styles.itBadge} ${styles.good}`}>Uptime 99.98%</span>
                </div>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>Last Automatic Database Backup</span>
                  <span className={styles.itValue}>10 min ago (Success)</span>
                </div>
              </div>
            </Card>
          )}

          {/* Finance Compliance status card */}
          {isFinance && (
            <Card interactive={false} className={styles.itStatusCard}>
              <div className={styles.itHeader}>
                <Scale size={18} className={styles.financeIcon} />
                <h3>Tax Compliance & Audit Status</h3>
              </div>
              <div className={styles.itGrid}>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>GSTR-1 Filing Status (June)</span>
                  <span className={`${styles.itBadge} ${styles.good}`}>Filed (E-filed)</span>
                </div>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>E-Way Bill generations (Month)</span>
                  <span className={styles.itValue}>1,450 successfully generated</span>
                </div>
                <div className={styles.itMetric}>
                  <span className={styles.itLabel}>Cycle Count Audit Variance Limit</span>
                  <span className={`${styles.itBadge} ${styles.warning}`}>Limit threshold 1%</span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
