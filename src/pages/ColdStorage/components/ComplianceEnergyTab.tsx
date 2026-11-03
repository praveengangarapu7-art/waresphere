import React, { useState, useMemo } from 'react'
import { ColdStorageZone } from '../../../types/coldStorage'
import { Modal } from '../../../components/ui/Modal/Modal'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Award, Zap, FileText, CheckCircle } from 'lucide-react'
import styles from './ComplianceEnergyTab.module.css'

interface ComplianceEnergyTabProps {
  zones: ColdStorageZone[]
}

export const ComplianceEnergyTab: React.FC<ComplianceEnergyTabProps> = ({ zones }) => {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Quarter'>('Month')
  const [showReport, setShowReport] = useState(false)

  // Mock compliance data based on period
  const complianceData = useMemo(() => {
    const factor = period === 'Week' ? 1.0 : period === 'Month' ? 0.98 : 0.95
    return zones.map(zone => {
      // Degrade NCR Deep Freeze since it is breached
      const isBreached = zone.status === 'Critical'
      const rate = isBreached ? (88.5 * factor) : (99.2 * factor)
      
      return {
        zoneName: zone.zoneName,
        complianceRate: parseFloat(Math.min(100, rate).toFixed(1)),
        deviations: isBreached ? (period === 'Week' ? 2 : period === 'Month' ? 6 : 14) : 0,
        durationMin: isBreached ? (period === 'Week' ? 120 : period === 'Month' ? 380 : 890) : 0
      }
    })
  }, [zones, period])

  // Mock energy consumption data (kWh)
  const energyData = useMemo(() => {
    const points = period === 'Week' ? 7 : period === 'Month' ? 10 : 12
    const labelPrefix = period === 'Week' ? 'Day' : period === 'Month' ? 'Oct' : 'Month'
    
    return Array.from({ length: points }).map((_, idx) => ({
      label: `${labelPrefix} ${idx + 1}`,
      chillerKwh: Math.round(450 + Math.sin(idx) * 80),
      backupGenKwh: Math.round(50 + Math.cos(idx) * 20)
    }))
  }, [period])

  const totalEnergy = useMemo(() => {
    return energyData.reduce((acc, curr) => acc + curr.chillerKwh + curr.backupGenKwh, 0)
  }, [energyData])

  return (
    <div className={styles.container}>
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.periodSelector}>
          <button
            onClick={() => setPeriod('Week')}
            className={`${styles.periodBtn} ${period === 'Week' ? styles.active : ''}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('Month')}
            className={`${styles.periodBtn} ${period === 'Month' ? styles.active : ''}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('Quarter')}
            className={`${styles.periodBtn} ${period === 'Quarter' ? styles.active : ''}`}
          >
            Quarterly
          </button>
        </div>

        <button onClick={() => setShowReport(true)} className={styles.btnReport}>
          <FileText size={14} />
          <span>Generate Audit Report</span>
        </button>
      </div>

      <div className={styles.splitGrid}>
        {/* Compliance Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Award size={16} className={styles.iconAward} />
            <h4>Zone Compliance Rates (Time-in-Range)</h4>
          </div>
          
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="zoneName" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={9} domain={[80, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="complianceRate" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.summaryTableBox}>
            <Table headers={['Zone Identification', 'Compliance %', 'Breaches Logged', 'Breach Time']}>
              {complianceData.map(c => (
                <tr key={c.zoneName}>
                  <td><strong>{c.zoneName}</strong></td>
                  <td>
                    <strong className={c.complianceRate < 95 ? styles.warnText : styles.successText}>
                      {c.complianceRate}%
                    </strong>
                  </td>
                  <td>{c.deviations} events</td>
                  <td>{c.durationMin} mins</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        {/* Energy Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Zap size={16} className={styles.iconZap} />
            <h4>Environmental Cooling Energy Logs</h4>
          </div>

          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '10px'
                  }}
                />
                <Line type="monotone" dataKey="chillerKwh" name="Chillers (kWh)" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="backupGenKwh" name="Backup Generators (kWh)" stroke="#f5a623" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.energyTotal}>
            <span>Total Cumulative Power Consumed:</span>
            <strong>{totalEnergy.toLocaleString('en-IN')} kWh</strong>
          </div>
        </div>
      </div>

      {/* Compliance Report Modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="Audit-Ready Compliance Report">
        <div className={styles.reportContainer}>
          <div className={styles.reportHeader}>
            <CheckCircle size={28} className={styles.checkIcon} />
            <div>
              <h3>WareSphere Cold Chain Compliance Sign-off</h3>
              <p>Generated on {new Date().toISOString().split('T')[0]} · Audit Period: {period}</p>
            </div>
          </div>

          <div className={styles.reportMain}>
            <div className={styles.repRow}>
              <span>Monitored Facility Nodes:</span>
              <strong>{zones.length} 冷 chain chambers</strong>
            </div>
            <div className={styles.repRow}>
              <span>Average Fleet SLA:</span>
              <strong>97.8% Compliance Rate</strong>
            </div>
          </div>

          <Table headers={['Chamber Name', 'Target Range', 'SLA Result', 'Status']}>
            {zones.map(z => {
              const comp = complianceData.find(c => c.zoneName === z.zoneName)
              return (
                <tr key={z.zoneName}>
                  <td>{z.zoneName}</td>
                  <td>{z.targetRange.min}°C to {z.targetRange.max}°C</td>
                  <td><strong>{comp?.complianceRate}%</strong></td>
                  <td>
                    <Badge variant={z.status === 'Critical' ? 'danger' : 'success'}>
                      {z.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </Table>

          <div className={styles.reportFooter}>
            <p>This document serves as verification that all environmental logs are recorded under regulatory standard parameters.</p>
            <button onClick={() => setShowReport(false)} className={styles.btnPrimaryClose}>
              Approve & Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default ComplianceEnergyTab
