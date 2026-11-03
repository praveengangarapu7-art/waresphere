import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { Badge } from '../../components/ui/Badge/Badge'
import { Table } from '../../components/ui/Table/Table'
import { useRole } from '../../hooks/useRole'
import {
  getReorderRecommendations,
  getExpiringProducts,
  getColdStorageRisks,
  getOutboundPriorities,
} from '../../services/warehouseIntelligenceService'
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Thermometer,
  Package,
  Clock,
  BarChart2,
  Brain,
  ShieldAlert,
  Lightbulb,
  CheckCircle,
} from 'lucide-react'
import styles from './AIInsights.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────
interface InsightCard {
  id: string
  type: 'dead-stock' | 'reorder' | 'cold-chain' | 'otif' | 'shrinkage' | 'compliance'
  severity: 'critical' | 'warning' | 'info' | 'success'
  title: string
  summary: string
  detail: string
  warehouse: string
  timestamp: string
  actionLabel?: string
  confidence?: number // 0–100
}

// ─── Live insight derivation (built from warehouseIntelligenceService output) ─
// Each card below is derived only from real fields returned by the service.
// Categories with no supporting service function (shrinkage, compliance) and
// the "dead-stock" concept of stagnant/zero-movement inventory are not
// fabricated here — see AIInsights build report for details.
const buildLiveInsights = (): InsightCard[] => {
  const reorderRecommendations = getReorderRecommendations()
  const expiringProducts = getExpiringProducts(30)
  const coldStorageRisks = getColdStorageRisks()
  const outboundPriorities = getOutboundPriorities()
  const cards: InsightCard[] = []

  const distinctWarehouseLabel = (warehouses: string[]): string => {
    const distinct = Array.from(new Set(warehouses))
    return distinct.length === 1 ? distinct[0] : 'Multiple Warehouses'
  }

  // Reorder / stockout risk — from getReorderRecommendations()
  const reorderGroups: { priority: 'critical' | 'high' | 'medium'; label: string; title: string }[] = [
    { priority: 'critical', label: 'out of stock', title: 'Critical Reorder — SKUs Out of Stock' },
    { priority: 'high', label: 'below safety stock', title: 'High Priority Reorder — SKUs Below Safety Stock' },
    { priority: 'medium', label: 'below reorder point', title: 'Reorder Recommended — SKUs Below Reorder Point' },
  ]
  reorderGroups.forEach(group => {
    const items = reorderRecommendations.filter(r => r.priority === group.priority)
    if (items.length === 0) return
    const names = items.slice(0, 3).map(i => i.sku)
    const totalRecommendedQty = items.reduce((sum, i) => sum + i.recommendedQuantity, 0)
    cards.push({
      id: `reorder-${group.priority}`,
      type: 'reorder',
      severity: group.priority === 'critical' ? 'critical' : group.priority === 'high' ? 'warning' : 'info',
      title: `${group.title} (${items.length})`,
      summary: `${names.join(', ')}${items.length > names.length ? ` and ${items.length - names.length} more` : ''} ${items.length > 1 ? 'are' : 'is'} ${group.label}.`,
      detail: `Recommended replenishment across these SKUs: ${totalRecommendedQty.toLocaleString('en-IN')} units. Affected: ${items.map(i => `${i.sku} (${i.warehouse}, current ${i.currentQuantity.toLocaleString('en-IN')}/reorder ${i.reorderPoint.toLocaleString('en-IN')})`).join('; ')}.`,
      warehouse: distinctWarehouseLabel(items.map(i => i.warehouse)),
      timestamp: '—',
      actionLabel: 'View Reorder Recommendations',
    })
  })

  // Expiry / at-risk stock — from getExpiringProducts(30)
  const expiryGroups: { riskLevel: 'expired' | 'critical' | 'high'; title: string }[] = [
    { riskLevel: 'expired', title: 'Expired Stock' },
    { riskLevel: 'critical', title: 'Critical Expiry Risk (within 7 days)' },
    { riskLevel: 'high', title: 'Expiry Risk (within 30 days)' },
  ]
  expiryGroups.forEach(group => {
    const items = expiringProducts.filter(p => p.riskLevel === group.riskLevel)
    if (items.length === 0) return
    const names = items.slice(0, 3).map(i => `${i.sku} (batch ${i.batch})`)
    cards.push({
      id: `expiry-${group.riskLevel}`,
      type: 'dead-stock',
      severity: group.riskLevel === 'high' ? 'warning' : 'critical',
      title: `${group.title} — ${items.length} Batch${items.length > 1 ? 'es' : ''}`,
      summary: `${names.join(', ')}${items.length > names.length ? ` and ${items.length - names.length} more` : ''}.`,
      detail: items.map(i => `${i.sku} batch ${i.batch} at ${i.warehouse}: ${i.quantity.toLocaleString('en-IN')} units, expiry ${i.expiryDate} (${i.daysRemaining} day${i.daysRemaining === 1 ? '' : 's'} remaining).`).join(' '),
      warehouse: distinctWarehouseLabel(items.map(i => i.warehouse)),
      timestamp: '—',
      actionLabel: 'View Expiring Batches',
    })
  })

  // Cold storage risk — from getColdStorageRisks()
  const coldZones = [
    ...coldStorageRisks.criticalZones.map(zone => ({ zone, severity: 'critical' as const })),
    ...coldStorageRisks.warningZones.map(zone => ({ zone, severity: 'warning' as const })),
  ]
  coldZones.forEach(({ zone, severity }) => {
    const deviation = coldStorageRisks.temperatureDeviations.find(d => d.zone === zone.zoneName)
    const sensorIssues = coldStorageRisks.sensorHealthProblems.filter(s => s.zone === zone.zoneName)
    const maintenanceForZone = coldStorageRisks.maintenanceIssues.filter(m => m.zoneId === zone.id)
    const detailParts = [
      `Current temperature ${zone.currentReading.temp}°${zone.targetRange.unit} against target range ${zone.targetRange.min}°${zone.targetRange.unit} to ${zone.targetRange.max}°${zone.targetRange.unit}${deviation ? ` (deviation ${deviation.deviation > 0 ? '+' : ''}${deviation.deviation}°${zone.targetRange.unit})` : ''}.`,
    ]
    if (sensorIssues.length > 0) {
      detailParts.push(`Sensor issues: ${sensorIssues.map(s => `${s.sensorId} (${s.problems.join(', ')})`).join('; ')}.`)
    }
    if (maintenanceForZone.length > 0) {
      detailParts.push(`Related maintenance: ${maintenanceForZone.map(m => `${m.equipmentName} (${m.status})`).join('; ')}.`)
    }
    cards.push({
      id: `cold-${zone.id}`,
      type: 'cold-chain',
      severity,
      title: `Cold Storage ${zone.status} — ${zone.zoneName}`,
      summary: `Current temperature ${zone.currentReading.temp}°${zone.targetRange.unit} vs target ${zone.targetRange.min}°${zone.targetRange.unit} to ${zone.targetRange.max}°${zone.targetRange.unit}.`,
      detail: detailParts.join(' '),
      warehouse: zone.warehouseName,
      timestamp: zone.currentReading.timestamp,
      actionLabel: 'Go to Cold Storage',
    })
  })

  // Outbound fulfillment risk — from getOutboundPriorities()
  const otifGroups: { priority: 'critical' | 'high' | 'medium' | 'low'; label: string }[] = [
    { priority: 'critical', label: 'Critical' },
    { priority: 'high', label: 'High Priority' },
    { priority: 'medium', label: 'Medium Priority' },
    { priority: 'low', label: 'Low Priority' },
  ]
  otifGroups.forEach(group => {
    const items = outboundPriorities.filter(o => o.priority === group.priority)
    if (items.length === 0) return
    const orderNumbers = items.slice(0, 3).map(i => i.orderNumber)
    const distinctReasons = Array.from(new Set(items.flatMap(i => i.reasons)))
    cards.push({
      id: `otif-${group.priority}`,
      type: 'otif',
      severity: group.priority === 'critical' ? 'critical' : group.priority === 'high' ? 'warning' : 'info',
      title: `${group.label} Fulfillment Risk — ${items.length} Outbound Order${items.length > 1 ? 's' : ''} Flagged`,
      summary: `${orderNumbers.join(', ')}${items.length > orderNumbers.length ? ` and ${items.length - orderNumbers.length} more` : ''}: ${distinctReasons.slice(0, 2).join('; ')}.`,
      detail: items.map(i => `${i.orderNumber} (${i.warehouse}, ${i.status}): ${i.reasons.join(', ')}. Picking ${i.pickingProgress.picked.toLocaleString('en-IN')}/${i.pickingProgress.ordered.toLocaleString('en-IN')}, Packing ${i.packingProgress.packed.toLocaleString('en-IN')}/${i.packingProgress.picked.toLocaleString('en-IN')}.`).join(' '),
      warehouse: distinctWarehouseLabel(items.map(i => i.warehouse)),
      timestamp: '—',
      actionLabel: 'View Outbound Orders',
    })
  })

  return cards
}

// ─── Static demo data (not yet connected to a service) ────────────────────────
const anomalyTimeline = [
  { time: '20:03', event: 'Cold chain breach resolved at Hyderabad Pharma Depo — Cell 2 temperature normalized.', type: 'success' },
  { time: '19:51', event: 'AI flagged cold chain breach at Hyderabad Pharma Depo — maintenance auto-triggered.', type: 'critical' },
  { time: '19:29', event: 'OTIF deviation predicted for NCR Industrial Center — carrier delay model updated.', type: 'warning' },
  { time: '18:45', event: 'Reorder recommendation generated for 5 pharma SKUs in Pune — confidence 88%.', type: 'info' },
  { time: '17:30', event: 'Inventory accuracy variance detected at Bhiwandi Zone B — cycle count scheduled.', type: 'warning' },
  { time: '16:00', event: 'Dead stock risk model updated for 3 SKU segments in Pune Chakan — risk elevated.', type: 'warning' },
  { time: '08:00', event: 'Morning AI model refresh complete — 6 insights generated across all facilities.', type: 'info' },
]

const severityConfig = {
  critical: { color: styles.insightCritical, badgeVariant: 'danger' as const, icon: <ShieldAlert size={18} /> },
  warning: { color: styles.insightWarning, badgeVariant: 'warning' as const, icon: <AlertTriangle size={18} /> },
  info: { color: styles.insightInfo, badgeVariant: 'info' as const, icon: <Lightbulb size={18} /> },
  success: { color: styles.insightSuccess, badgeVariant: 'success' as const, icon: <CheckCircle size={18} /> },
}

// ─── Component ────────────────────────────────────────────────────────────────
// Where each insight category's action button should navigate to — the
// module (Inventory, Cold Storage, Outbound) that can actually act on it.
const INSIGHT_TYPE_ROUTES: Record<InsightCard['type'], string> = {
  'dead-stock': '/inventory',
  reorder: '/inventory',
  'cold-chain': '/cold-storage',
  otif: '/outbound',
  shrinkage: '/reports',
  compliance: '/reports'
}

export const AIInsights: React.FC = () => {
  const { activeRole } = useRole()
  const navigate = useNavigate()
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | InsightCard['type']>('all')
  const [refreshing, setRefreshing] = useState(false)

  const isFinance = activeRole === 'Finance/Compliance'
  const isIT = activeRole === 'IT Admin'
  const isAuditor = activeRole === 'External Auditor'

  const reorderRecommendations = getReorderRecommendations()
  const liveInsights = buildLiveInsights()

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1800)
  }

  const filters: { key: 'all' | InsightCard['type']; label: string }[] = [
    { key: 'all', label: 'All Insights' },
    { key: 'dead-stock', label: 'Dead Stock' },
    { key: 'reorder', label: 'Reorder' },
    { key: 'cold-chain', label: 'Cold Chain' },
    { key: 'otif', label: 'OTIF' },
    { key: 'shrinkage', label: 'Shrinkage' },
    { key: 'compliance', label: 'Compliance' },
  ]

  const filteredInsights = liveInsights.filter(ins =>
    activeFilter === 'all' ? true : ins.type === activeFilter
  )

  const criticalCount = liveInsights.filter(i => i.severity === 'critical').length
  const warningCount = liveInsights.filter(i => i.severity === 'warning').length
  const infoCount = liveInsights.filter(i => i.severity === 'info').length

  const getPriorityVariant = (priority: ReturnType<typeof getReorderRecommendations>[number]['priority']) => {
    if (priority === 'critical') return 'danger' as const
    if (priority === 'high') return 'warning' as const
    return 'secondary' as const
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="AI Augmented Insights"
        description="Machine learning–powered inventory intelligence, anomaly detection, and predictive recommendations."
        actions={
          <button className={styles.btnRefresh} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh Models'}
          </button>
        }
      />

      {/* Summary counters */}
      <div className={styles.summaryBar}>
        <div className={`${styles.summaryTile} ${styles.summaryTileCritical}`}>
          <ShieldAlert size={18} />
          <span className={styles.summaryCount}>{criticalCount}</span>
          <span className={styles.summaryLabel}>Critical</span>
        </div>
        <div className={`${styles.summaryTile} ${styles.summaryTileWarning}`}>
          <AlertTriangle size={18} />
          <span className={styles.summaryCount}>{warningCount}</span>
          <span className={styles.summaryLabel}>Warnings</span>
        </div>
        <div className={`${styles.summaryTile} ${styles.summaryTileInfo}`}>
          <Lightbulb size={18} />
          <span className={styles.summaryCount}>{infoCount}</span>
          <span className={styles.summaryLabel}>Informational</span>
        </div>
        <div className={`${styles.summaryTile} ${styles.summaryTileModel}`}>
          <Brain size={18} />
          <span className={styles.summaryCount}>6</span>
          <span className={styles.summaryLabel}>Active Models</span>
        </div>
        <div className={styles.modelUpdated}>
          <Clock size={13} />
          <span>Model last refreshed: Today, 08:00 AM</span>
        </div>
      </div>

      {/* AI Insight Cards */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Sparkles size={18} />
            <h2>Live Intelligence Feed</h2>
          </div>
          <div className={styles.filterTabs}>
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`${styles.filterTab} ${activeFilter === f.key ? styles.filterTabActive : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.insightGrid}>
          {filteredInsights.map(insight => {
            const config = severityConfig[insight.severity]
            const isExpanded = expandedInsight === insight.id

            return (
              <div key={insight.id} className={`${styles.insightCard} ${config.color}`}>
                <div className={styles.insightHeader}>
                  <div className={styles.insightIconArea}>
                    {config.icon}
                  </div>
                  <div className={styles.insightMeta}>
                    <Badge variant={config.badgeVariant}>{insight.severity.toUpperCase()}</Badge>
                    <span className={styles.insightTimestamp}>{insight.timestamp}</span>
                  </div>
                </div>

                <h3 className={styles.insightTitle}>{insight.title}</h3>
                <p className={styles.insightSummary}>{insight.summary}</p>

                {isExpanded && (
                  <p className={styles.insightDetail}>{insight.detail}</p>
                )}

                {insight.confidence !== undefined && (
                  <div className={styles.confidenceBar}>
                    <span className={styles.confidenceLabel}>AI Confidence</span>
                    <div className={styles.confidenceTrack}>
                      <div
                        className={styles.confidenceFill}
                        style={{ width: `${insight.confidence}%` }}
                      />
                    </div>
                    <span className={styles.confidenceValue}>{insight.confidence}%</span>
                  </div>
                )}

                <div className={styles.insightWarehouseTag}>
                  <Package size={12} />
                  <span>{insight.warehouse}</span>
                </div>

                <div className={styles.insightActions}>
                  <button
                    className={styles.btnExpand}
                    onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  >
                    {isExpanded ? 'Show less' : 'Show detail'}
                  </button>
                  {insight.actionLabel && !isAuditor && (
                    <button
                      className={styles.btnAction}
                      onClick={() => navigate(INSIGHT_TYPE_ROUTES[insight.type])}
                    >
                      {insight.actionLabel} <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reorder Recommendations Table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <TrendingDown size={18} />
            <h2>Predictive Reorder Recommendations</h2>
          </div>
          <Badge variant="info">{reorderRecommendations.length} SKUs flagged</Badge>
        </div>
        <div className={styles.tableCard}>
          <Table headers={['SKU Code', 'Product', 'Warehouse', 'Current Stock', 'Reorder Point', 'Recommended Qty', 'Reason', 'Confidence', 'Urgency']}>
            {reorderRecommendations.map(r => (
              <tr key={r.sku}>
                <td><code className={styles.skuCode}>{r.sku}</code></td>
                <td><strong>{r.product}</strong></td>
                <td>{r.warehouse}</td>
                <td className={r.currentQuantity < r.reorderPoint ? styles.stockLow : ''}>{r.currentQuantity.toLocaleString('en-IN')}</td>
                <td>{r.reorderPoint.toLocaleString('en-IN')}</td>
                <td><strong>{r.recommendedQuantity.toLocaleString('en-IN')}</strong></td>
                <td className={styles.reasonCell}>—</td>
                <td>—</td>
                <td><Badge variant={getPriorityVariant(r.priority)}>{r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}</Badge></td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Anomaly Timeline */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <BarChart2 size={18} />
            <h2>Anomaly Detection Timeline</h2>
          </div>
          <span className={styles.timelineDate}>Today — 12 Jul 2026</span>
        </div>
        <div className={styles.timeline}>
          {anomalyTimeline.map((entry, i) => (
            <div key={i} className={`${styles.timelineEntry} ${styles[`tl${entry.type}`]}`}>
              <div className={styles.timelineTime}>{entry.time}</div>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>{entry.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* IT Admin model health panel */}
      {isIT && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Brain size={18} />
              <h2>AI Model Health (IT Admin View)</h2>
            </div>
          </div>
          <div className={styles.modelGrid}>
            {[
              { name: 'Dead Stock Risk Model', version: 'v2.4.1', lastTrain: '09 Jul 2026', accuracy: '91.2%', status: 'Healthy' },
              { name: 'Demand Forecasting Model', version: 'v3.1.0', lastTrain: '08 Jul 2026', accuracy: '88.7%', status: 'Healthy' },
              { name: 'Cold Chain Anomaly Detector', version: 'v1.9.2', lastTrain: '10 Jul 2026', accuracy: '97.5%', status: 'Healthy' },
              { name: 'OTIF Prediction Engine', version: 'v2.0.3', lastTrain: '07 Jul 2026', accuracy: '83.1%', status: 'Retraining' },
              { name: 'Shrinkage Pattern Analyzer', version: 'v1.5.0', lastTrain: '05 Jul 2026', accuracy: '79.6%', status: 'Healthy' },
              { name: 'Compliance Alert Classifier', version: 'v1.2.1', lastTrain: '01 Jul 2026', accuracy: '99.0%', status: 'Healthy' },
            ].map((m, i) => (
              <div key={i} className={styles.modelCard}>
                <div className={styles.modelName}>{m.name}</div>
                <div className={styles.modelMeta}>
                  <span className={styles.modelVersion}>{m.version}</span>
                  <Badge variant={m.status === 'Healthy' ? 'success' : 'warning'}>{m.status}</Badge>
                </div>
                <div className={styles.modelDetails}>
                  <span>Last train: {m.lastTrain}</span>
                  <span>Accuracy: <strong>{m.accuracy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finance compliance view */}
      {isFinance && (
        <div className={styles.financePanel}>
          <div className={styles.sectionTitle}>
            <Thermometer size={18} />
            <h2>AI-Driven Compliance Signals</h2>
          </div>
          <div className={styles.complianceGrid}>
            {[
              { label: 'GST E-Way Bill expiry risk (next 24h)', value: '12 bills', risk: 'High' },
              { label: 'Shrinkage write-off projected (this month)', value: '₹4.2L', risk: 'Medium' },
              { label: 'Cycle count audit variance alerts', value: '2 zones', risk: 'Medium' },
              { label: 'Dead stock write-down exposure', value: '₹18.4L', risk: 'High' },
            ].map((item, i) => (
              <div key={i} className={styles.complianceItem}>
                <span className={styles.complianceLabel}>{item.label}</span>
                <div className={styles.complianceValue}>
                  <strong>{item.value}</strong>
                  <Badge variant={item.risk === 'High' ? 'danger' : 'warning'}>{item.risk} Risk</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInsights
