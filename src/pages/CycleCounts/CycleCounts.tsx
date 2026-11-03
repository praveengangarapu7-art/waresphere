import React, { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { CreateCountPlanModal } from './components/CreateCountPlanModal'
import { CountWorkflowDrawer } from './components/CountWorkflowDrawer'
import { cycleCountService } from '../../services/cycleCountService'
import { mockWarehouses } from '../../mock-data/warehouses'
import { mockAccuracyTrend } from '../../mock-data/cycleCounts'
import { CycleCount } from '../../types/cycleCount'
import {
  Plus,
  ClipboardCheck,
  Activity,
  Clock,
  AlertCircle,
  Search,
  X,
  Target,
} from 'lucide-react'
import styles from './CycleCounts.module.css'

// ─── Status badge map ─────────────────────────────────────────────────────────
const statusVariant = (status: CycleCount['status']) => {
  switch (status) {
    case 'Scheduled':        return 'secondary' as const
    case 'In Progress':      return 'info' as const
    case 'Pending Approval': return 'warning' as const
    case 'Completed':        return 'success' as const
    case 'Rejected':         return 'danger' as const
    default:                 return 'default' as const
  }
}

const strategyVariant = (strategy: CycleCount['strategy']) => {
  switch (strategy) {
    case 'ABC-Based':              return 'primary' as const
    case 'Zone-Based':             return 'info' as const
    case 'Random Sampling':        return 'secondary' as const
    case 'Event-Triggered':        return 'warning' as const
    case 'Full Physical Inventory':return 'danger' as const
    default:                       return 'default' as const
  }
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const STATUS_TABS = [
  'All',
  'Scheduled',
  'In Progress',
  'Pending Approval',
  'Completed',
  'Rejected',
] as const

const STRATEGIES = [
  'All Strategies',
  'ABC-Based',
  'Zone-Based',
  'Random Sampling',
  'Event-Triggered',
  'Full Physical Inventory',
] as const

// ─── Component ────────────────────────────────────────────────────────────────
export const CycleCounts: React.FC = () => {
  const [counts, setCounts] = useState<CycleCount[]>([])
  const [loading, setLoading] = useState(true)
  const [accuracyData, setAccuracyData] = useState(mockAccuracyTrend)

  // Filters
  const [activeTab, setActiveTab]             = useState<string>('All')
  const [search, setSearch]                   = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [selectedStrategy, setSelectedStrategy]   = useState('All Strategies')
  const [dateFrom, setDateFrom]               = useState('')
  const [dateTo, setDateTo]                   = useState('')

  // Modals/Drawers
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedCount, setSelectedCount]     = useState<CycleCount | null>(null)
  const [isDrawerOpen, setIsDrawerOpen]       = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await cycleCountService.getCycleCounts()
      setCounts(data)
      setLoading(false)
    }
    load()
  }, [])

  // ── Counts
  const handleCreatePlan = async (plan: Omit<CycleCount, 'id'>) => {
    const created = await cycleCountService.createCycleCount(plan)
    setCounts(prev => [created, ...prev])
    setIsPlanModalOpen(false)
  }

  const handleSaveCount = async (updated: CycleCount) => {
    await cycleCountService.updateCycleCount(updated)
    setCounts(prev => prev.map(c => c.id === updated.id ? updated : c))
    // If count was just completed, add a data point to accuracy chart
    if (updated.status === 'Completed') {
      const total = updated.items.reduce((a, i) => a + i.systemQty, 0)
      const varSum = updated.items.reduce((a, i) => a + Math.abs(i.varianceQty || 0), 0)
      const acc = total > 0 ? parseFloat(((total - varSum) / total * 100).toFixed(1)) : 100
      setAccuracyData(prev => [
        ...prev.slice(1),
        { week: `Wk ${prev.length + 1}`, accuracy: acc },
      ])
    }
  }

  const handleRowClick = (count: CycleCount) => {
    setSelectedCount(count)
    setIsDrawerOpen(true)
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedWarehouse('all')
    setSelectedStrategy('All Strategies')
    setDateFrom('')
    setDateTo('')
    setActiveTab('All')
  }

  // ── Computed values
  const tabCounts = useMemo(() => {
    const result: Record<string, number> = { All: counts.length }
    STATUS_TABS.slice(1).forEach(tab => {
      result[tab] = counts.filter(c => c.status === tab).length
    })
    return result
  }, [counts])

  const filteredCounts = useMemo(() => {
    let res = [...counts]
    if (activeTab !== 'All') res = res.filter(c => c.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(c =>
        c.countNumber.toLowerCase().includes(q) ||
        c.assignedTo.toLowerCase().includes(q) ||
        c.scopeLabel.toLowerCase().includes(q)
      )
    }
    if (selectedWarehouse !== 'all') res = res.filter(c => c.warehouseId === selectedWarehouse)
    if (selectedStrategy !== 'All Strategies') res = res.filter(c => c.strategy === selectedStrategy)
    if (dateFrom) res = res.filter(c => c.scheduledDate >= dateFrom)
    if (dateTo)   res = res.filter(c => c.scheduledDate <= dateTo)
    return res
  }, [counts, activeTab, search, selectedWarehouse, selectedStrategy, dateFrom, dateTo])

  const hasFilters = search || selectedWarehouse !== 'all' || selectedStrategy !== 'All Strategies' || dateFrom || dateTo || activeTab !== 'All'

  // ── Summary stats
  const dueThisWeek = counts.filter(c =>
    c.status === 'Scheduled' &&
    c.scheduledDate >= '2026-07-12' &&
    c.scheduledDate <= '2026-07-18'
  ).length
  const inProgress       = counts.filter(c => c.status === 'In Progress').length
  const pendingApproval  = counts.filter(c => c.status === 'Pending Approval').length
  const rollingAccuracy  = accuracyData[accuracyData.length - 1]?.accuracy ?? 0

  const getWarehouseName = (id: string) => mockWarehouses.find(w => w.id === id)?.name || id

  const getVarianceDisplay = (count: CycleCount) => {
    if (count.totalVarianceValue === undefined) return '—'
    if (count.totalVarianceValue === 0) return <span className={styles.varOk}>0.00%</span>
    const allPcts = count.items
      .map(i => Math.abs(i.variancePercent || 0))
      .filter(v => v > 0)
    const maxPct = allPcts.length > 0 ? Math.max(...allPcts) : 0
    const cls = maxPct > 10 ? styles.varCritical : maxPct > 5 ? styles.varWarn : styles.varOk
    return <span className={cls}>{maxPct > 0 ? `${maxPct.toFixed(1)}%` : '< 1%'}</span>
  }

  if (loading) {
    return <div className={styles.loadingState}>Loading cycle count registry…</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Cycle Counts"
        description="Plan, execute, and reconcile periodic inventory counts to maintain accuracy targets."
        actions={
          <button className={styles.btnPrimary} onClick={() => setIsPlanModalOpen(true)}>
            <Plus size={16} />
            Create Count Plan
          </button>
        }
      />

      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <StatCard
          title="Counts Due This Week"
          value={dueThisWeek}
          icon={<Clock size={18} />}
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={<Activity size={18} />}
          variant={inProgress > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Pending Variance Approval"
          value={pendingApproval}
          icon={<AlertCircle size={18} />}
          variant={pendingApproval > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Rolling Inventory Accuracy"
          value={`${rollingAccuracy}%`}
          icon={<ClipboardCheck size={18} />}
          description="Target: > 98%"
        />
      </div>

      {/* ── Accuracy trend chart ────────────────────────────────────────────── */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitleRow}>
            <Target size={16} className={styles.chartIcon} />
            <h3 className={styles.chartTitle}>Inventory Accuracy Trend — Completed Counts (12 Weeks)</h3>
          </div>
          <span className={styles.chartTarget}>Target: &gt; 98%</span>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="week"
                stroke="var(--color-text-secondary)"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                domain={[93, 100]}
                stroke="var(--color-text-secondary)"
                fontSize={10}
                tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '11px',
                }}
                formatter={(val: number) => [`${val}%`, 'Inventory Accuracy']}
              />
              <ReferenceLine
                y={98}
                stroke="var(--color-primary)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: '98% Target',
                  fill: 'var(--color-primary)',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Accuracy %"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-primary)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Status tabs ─────────────────────────────────────────────────────── */}
      <div className={styles.tabContainer}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            <span>{tab}</span>
            <span className={styles.tabBadge}>{tabCounts[tab] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search count number, counter name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={selectedWarehouse}
          onChange={e => setSelectedWarehouse(e.target.value)}
        >
          <option value="all">All Warehouses</option>
          {mockWarehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={selectedStrategy}
          onChange={e => setSelectedStrategy(e.target.value)}
        >
          {STRATEGIES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="date"
          className={styles.filterSelect}
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          title="Scheduled from"
        />
        <input
          type="date"
          className={styles.filterSelect}
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          title="Scheduled until"
        />

        {hasFilters && (
          <button className={styles.clearBtn} onClick={handleClearFilters}>
            <X size={13} /> Clear
          </button>
        )}

        <span className={styles.resultCount}>
          {filteredCounts.length} of {counts.length}
        </span>
      </div>

      {/* ── Data table ──────────────────────────────────────────────────────── */}
      {filteredCounts.length === 0 ? (
        <EmptyState
          title="No Cycle Counts Found"
          description="Try adjusting your filters or create a new count plan."
          action={
            <button className={styles.btnPrimary} onClick={handleClearFilters}>
              Clear Filters
            </button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table
            headers={[
              'Count Number',
              'Strategy',
              'Scope / Warehouse',
              'Scheduled Date',
              'Items / Bins',
              'Assigned To',
              'Status',
              'Max Variance %',
            ]}
          >
            {filteredCounts.map(count => (
              <tr
                key={count.id}
                className={styles.clickableRow}
                onClick={() => handleRowClick(count)}
              >
                <td className={styles.codeCell}>
                  <code>{count.countNumber}</code>
                </td>
                <td>
                  <Badge variant={strategyVariant(count.strategy)}>
                    {count.strategy}
                  </Badge>
                </td>
                <td>
                  <div className={styles.scopeCell}>
                    <span className={styles.scopeLabel}>{count.scopeLabel}</span>
                    <span className={styles.scopeWarehouse}>{getWarehouseName(count.warehouseId)}</span>
                  </div>
                </td>
                <td className={styles.dateCell}>{count.scheduledDate}</td>
                <td>
                  {count.items.length} {count.items.length === 1 ? 'bin' : 'bins'}
                </td>
                <td>{count.assignedTo}</td>
                <td>
                  <Badge variant={statusVariant(count.status)}>{count.status}</Badge>
                </td>
                <td>{getVarianceDisplay(count)}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreateCountPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onAdd={handleCreatePlan}
      />

      <CountWorkflowDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedCount(null) }}
        count={selectedCount}
        onSave={handleSaveCount}
      />
    </div>
  )
}

export default CycleCounts
