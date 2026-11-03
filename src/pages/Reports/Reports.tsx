import React, { useState, useEffect } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { StatCard } from '../../components/ui/StatCard/StatCard'
import { Badge } from '../../components/ui/Badge/Badge'
import { Table } from '../../components/ui/Table/Table'
import { Modal } from '../../components/ui/Modal/Modal'
import { reportService } from '../../services/reportService'
import { warehouseService } from '../../services/warehouseService'
import { mockWarehouses } from '../../mock-data/warehouses'
import { useRole } from '../../hooks/useRole'
import { KPIValues } from '../../types/common'
import { Warehouse } from '../../types/warehouse'
import {
  BarChart2,
  Download,
  Clock,
  FileText,
  Thermometer,
  Package,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import styles from './Reports.module.css'

// ─── Report catalog data ──────────────────────────────────────────────────────
interface ReportDefinition {
  id: string
  title: string
  description: string
  category: 'operations' | 'finance' | 'compliance' | 'cold-chain'
  lastGenerated: string
  frequency: string
  icon: React.ReactNode
  status: 'ready' | 'generating' | 'scheduled'
}

const reportCatalog: ReportDefinition[] = [
  {
    id: 'r-inv-val',
    title: 'Inventory Valuation Report',
    description: 'Full SKU-level stock valuation with FIFO / FEFO and weighted average costing.',
    category: 'finance',
    lastGenerated: 'Today, 06:00 AM',
    frequency: 'Daily',
    icon: <Package size={20} />,
    status: 'ready',
  },
  {
    id: 'r-inbound',
    title: 'Inbound Receipt Summary',
    description: 'ASN-level receiving log including gate-entry, weighbridge, and QC inspection results.',
    category: 'operations',
    lastGenerated: 'Today, 07:30 AM',
    frequency: 'Daily',
    icon: <TrendingUp size={20} />,
    status: 'ready',
  },
  {
    id: 'r-outbound',
    title: 'Outbound Dispatch Report',
    description: 'Sales order fulfillment register with picking, packing, shipping doc and POD audit trail.',
    category: 'operations',
    lastGenerated: 'Today, 08:00 AM',
    frequency: 'Daily',
    icon: <FileText size={20} />,
    status: 'ready',
  },
  {
    id: 'r-cycle',
    title: 'Cycle Count Variance Report',
    description: 'Location-wise count discrepancies, variance %, and write-off recommendations.',
    category: 'operations',
    lastGenerated: 'Yesterday, 11:00 PM',
    frequency: 'Weekly',
    icon: <BarChart2 size={20} />,
    status: 'ready',
  },
  {
    id: 'r-cold',
    title: 'Cold Chain Compliance Report',
    description: 'Temperature & humidity log for all cold storage zones with breach incidents and resolution times.',
    category: 'cold-chain',
    lastGenerated: '10 Jul 2026',
    frequency: 'Weekly',
    icon: <Thermometer size={20} />,
    status: 'ready',
  },
  {
    id: 'r-gst',
    title: 'GST E-Way Bill Log',
    description: 'GSTIN-wise e-way bill generation register with validity, vehicle details and e-filing status.',
    category: 'compliance',
    lastGenerated: '01 Jul 2026',
    frequency: 'Monthly',
    icon: <ShieldCheck size={20} />,
    status: 'ready',
  },
  {
    id: 'r-shrinkage',
    title: 'Shrinkage & Loss Analysis',
    description: 'SKU-level stock shrinkage trends, expiry write-offs, and damage root-cause summary.',
    category: 'finance',
    lastGenerated: '01 Jul 2026',
    frequency: 'Monthly',
    icon: <AlertTriangle size={20} />,
    status: 'scheduled',
  },
  {
    id: 'r-otif',
    title: 'OTIF Performance Report',
    description: 'On-Time-In-Full fulfillment metrics broken down by carrier, zone, and product category.',
    category: 'operations',
    lastGenerated: '08 Jul 2026',
    frequency: 'Weekly',
    icon: <CheckCircle size={20} />,
    status: 'ready',
  },
]

const categoryColors: Record<ReportDefinition['category'], string> = {
  operations: 'info',
  finance: 'primary',
  compliance: 'warning',
  'cold-chain': 'secondary',
}

// ─── Recent exports table ─────────────────────────────────────────────────────
const recentExports = [
  { id: 'ex-1', report: 'Inventory Valuation Report', format: 'XLSX', warehouse: 'All Facilities', requestedBy: 'Devendra Gowda', timestamp: '12 Jul 2026 – 06:00 AM', size: '1.4 MB' },
  { id: 'ex-2', report: 'OTIF Performance Report', format: 'PDF', warehouse: 'Mumbai Logistics Hub', requestedBy: 'Sanjay Dutt', timestamp: '11 Jul 2026 – 09:15 AM', size: '420 KB' },
  { id: 'ex-3', report: 'GST E-Way Bill Log', format: 'CSV', warehouse: 'All Facilities', requestedBy: 'Manoj Bajpayee', timestamp: '01 Jul 2026 – 07:00 AM', size: '890 KB' },
  { id: 'ex-4', report: 'Cold Chain Compliance Report', format: 'PDF', warehouse: 'Hyderabad Pharma Depo', requestedBy: 'Kiran Patel', timestamp: '10 Jul 2026 – 05:30 PM', size: '210 KB' },
  { id: 'ex-5', report: 'Inbound Receipt Summary', format: 'XLSX', warehouse: 'NCR Industrial Center', requestedBy: 'Amit Patel', timestamp: '12 Jul 2026 – 08:00 AM', size: '670 KB' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export const Reports: React.FC = () => {
  const { activeRole } = useRole()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [kpis, setKpis] = useState<KPIValues[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [activeCategory, setActiveCategory] = useState<'all' | ReportDefinition['category']>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [schedules, setSchedules] = useState([
    { report: 'Inventory Valuation Report', schedule: 'Daily at 06:00 AM', recipients: 'finance@waresphere.in', format: 'XLSX', status: 'Active' },
    { report: 'GST E-Way Bill Log', schedule: '1st of every month at 07:00 AM', recipients: 'compliance@waresphere.in', format: 'CSV', status: 'Active' },
    { report: 'OTIF Performance Report', schedule: 'Every Monday at 08:00 AM', recipients: 'ops@waresphere.in', format: 'PDF', status: 'Active' },
  ])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [newScheduleReport, setNewScheduleReport] = useState(reportCatalog[0]?.title || '')
  const [newScheduleFrequency, setNewScheduleFrequency] = useState('Daily at 06:00 AM')
  const [newScheduleRecipients, setNewScheduleRecipients] = useState('')
  const [newScheduleFormat, setNewScheduleFormat] = useState('XLSX')

  const isFinance = activeRole === 'Finance/Compliance'
  const isAuditor = activeRole === 'External Auditor'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [whs, fetchedKpis] = await Promise.all([
        warehouseService.getWarehouses(),
        reportService.getKpis(selectedWarehouse),
      ])
      setWarehouses(whs)
      setKpis(fetchedKpis)
      setLoading(false)
    }
    load()
  }, [selectedWarehouse])

  const handleDownload = (reportId: string) => {
    setDownloadingId(reportId)
    setTimeout(() => setDownloadingId(null), 2000)
  }

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScheduleRecipients.trim()) return
    setSchedules(prev => [
      ...prev,
      {
        report: newScheduleReport,
        schedule: newScheduleFrequency,
        recipients: newScheduleRecipients.trim(),
        format: newScheduleFormat,
        status: 'Active'
      }
    ])
    setIsScheduleModalOpen(false)
    setNewScheduleRecipients('')
  }

  const filteredReports = reportCatalog.filter(r =>
    activeCategory === 'all' ? true : r.category === activeCategory
  )

  const categories: { key: 'all' | ReportDefinition['category']; label: string }[] = [
    { key: 'all', label: 'All Reports' },
    { key: 'operations', label: 'Operations' },
    { key: 'finance', label: 'Finance' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'cold-chain', label: 'Cold Chain' },
  ]

  return (
    <div className={styles.container}>
      <PageHeader
        title="Reports & Analytics"
        description="Generate, export, and schedule warehouse performance reports across all facilities."
        actions={
          <div className={styles.headerActions}>
            <select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className={styles.scopeSelect}
              disabled={loading}
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPI Summary Strip */}
      <div className={styles.kpiGrid}>
        {(loading ? [] : kpis).map(kpi => (
          <StatCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            description={`Target: ${kpi.target}`}
            variant={kpi.trend === 'down' && kpi.id !== 'kpi-utilization' ? 'warning' : 'default'}
          />
        ))}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>

      {/* Report Catalog */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FileText size={18} />
            <h2>Report Catalog</h2>
          </div>
          <div className={styles.categoryTabs}>
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`${styles.catTab} ${activeCategory === cat.key ? styles.catTabActive : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.reportGrid}>
          {filteredReports.map(report => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportCardHeader}>
                <div className={styles.reportIcon}>{report.icon}</div>
                <Badge variant={categoryColors[report.category] as any}>
                  {report.category === 'cold-chain' ? 'Cold Chain' : report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                </Badge>
              </div>
              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>
              <div className={styles.reportMeta}>
                <div className={styles.reportMetaItem}>
                  <Clock size={13} />
                  <span>Last: {report.lastGenerated}</span>
                </div>
                <div className={styles.reportMetaItem}>
                  <RefreshCw size={13} />
                  <span>{report.frequency}</span>
                </div>
              </div>
              {!isAuditor && (
                <div className={styles.reportActions}>
                  <button
                    className={styles.btnDownload}
                    onClick={() => handleDownload(report.id)}
                    disabled={downloadingId === report.id}
                  >
                    {downloadingId === report.id ? (
                      <><RefreshCw size={14} className={styles.spinning} /> Generating…</>
                    ) : (
                      <><Download size={14} /> Download XLSX</>
                    )}
                  </button>
                  <button
                    className={styles.btnPdf}
                    onClick={() => handleDownload(`${report.id}-pdf`)}
                    disabled={downloadingId === `${report.id}-pdf`}
                  >
                    {downloadingId === `${report.id}-pdf` ? (
                      <><RefreshCw size={14} className={styles.spinning} /> Generating…</>
                    ) : (
                      <><Download size={14} /> PDF</>
                    )}
                  </button>
                </div>
              )}
              {isAuditor && (
                <span className={styles.auditNote}>Read-only access — request export via Operations Director</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Exports log */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Download size={18} />
            <h2>Recent Export History</h2>
          </div>
        </div>
        <div className={styles.tableCard}>
          <Table headers={['Report Name', 'Format', 'Warehouse Scope', 'Requested By', 'Timestamp', 'File Size']}>
            {recentExports.map(ex => (
              <tr key={ex.id}>
                <td><strong>{ex.report}</strong></td>
                <td><Badge variant="secondary">{ex.format}</Badge></td>
                <td>{ex.warehouse}</td>
                <td>{ex.requestedBy}</td>
                <td className={styles.timestampCell}>{ex.timestamp}</td>
                <td>{ex.size}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Scheduled Exports (Finance & Ops Director only) */}
      {(isFinance || activeRole === 'Operations Director') && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Clock size={18} />
              <h2>Scheduled Exports</h2>
            </div>
            <button className={styles.btnSchedule} onClick={() => setIsScheduleModalOpen(true)}>
              + New Schedule
            </button>
          </div>
          <div className={styles.scheduleGrid}>
            {schedules.map((s, i) => (
              <div key={i} className={styles.scheduleCard}>
                <div className={styles.scheduleCardHeader}>
                  <span className={styles.scheduleTitle}>{s.report}</span>
                  <Badge variant="success">{s.status}</Badge>
                </div>
                <div className={styles.scheduleDetails}>
                  <div><span className={styles.scheduleLabel}>Schedule:</span> {s.schedule}</div>
                  <div><span className={styles.scheduleLabel}>Recipients:</span> {s.recipients}</div>
                  <div><span className={styles.scheduleLabel}>Format:</span> {s.format}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="New Scheduled Export">
        <form onSubmit={handleCreateSchedule} className={styles.scheduleForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Report *</label>
            <select
              className={styles.select}
              value={newScheduleReport}
              onChange={e => setNewScheduleReport(e.target.value)}
            >
              {reportCatalog.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Frequency *</label>
            <input
              className={styles.input}
              value={newScheduleFrequency}
              onChange={e => setNewScheduleFrequency(e.target.value)}
              placeholder="e.g. Daily at 06:00 AM"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Recipients *</label>
            <input
              className={styles.input}
              value={newScheduleRecipients}
              onChange={e => setNewScheduleRecipients(e.target.value)}
              placeholder="e.g. finance@waresphere.in"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Format *</label>
            <select
              className={styles.select}
              value={newScheduleFormat}
              onChange={e => setNewScheduleFormat(e.target.value)}
            >
              <option value="XLSX">XLSX</option>
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Create Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Reports
