import React, { useState, useMemo } from 'react'
import { DeviationAlert } from '../../../types/coldStorage'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { MessageSquare, Mail, PhoneCall, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './AlertHistoryTab.module.css'

interface AlertHistoryTabProps {
  alerts: DeviationAlert[]
}

export const AlertHistoryTab: React.FC<AlertHistoryTabProps> = ({ alerts }) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  
  // Filters
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const toggleExpand = (id: string) => {
    setExpandedAlertId(prev => (prev === id ? null : id))
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <span title="SMS"><MessageSquare size={12} className={styles.iconSms} /></span>
      case 'Email': return <span title="Email"><Mail size={12} className={styles.iconEmail} /></span>
      case 'WhatsApp': return <span title="WhatsApp"><PhoneCall size={12} className={styles.iconWa} /></span>
      case 'In-App': return <span title="In-App Notification"><Bell size={12} className={styles.iconInapp} /></span>
      default: return null
    }
  }

  const getEscalationTimeline = (alert: DeviationAlert) => {
    const isOngoing = alert.status === 'Ongoing'
    return [
      { min: 0, msg: 'Initial telemetry trigger. In-app warning pushed to Active Floor Staff.', done: true },
      { min: 15, msg: 'Threshold breach continues. SMS alert dispatched to Warehouse Supervisor.', done: alert.escalationTier !== 'Initial' },
      { min: 45, msg: 'Critical breach alert. WhatsApp escalation message pushed to Operations Manager.', done: alert.escalationTier === 'Manager' }
    ]
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false
      if (filterSeverity !== 'all') {
        if (filterSeverity === 'critical' && a.escalationTier !== 'Manager') return false
        if (filterSeverity === 'warning' && a.escalationTier === 'Manager') return false
      }
      return true
    })
  }, [alerts, filterSeverity, filterStatus])

  return (
    <div className={styles.container}>
      {/* Filter panel */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>Status Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Alerts</option>
            <option value="Ongoing">Ongoing Breach</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Tiers</option>
            <option value="critical">Critical (Manager Escaled)</option>
            <option value="warning">Warning (Supervisor/Initial)</option>
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table headers={['Zone / Facility', 'Breach Start', 'Duration', 'Peak Deviation', 'Escalation Tier', 'Fired Channels', 'Status', 'Timeline']}>
          {filteredAlerts.map(alert => {
            const isExpanded = expandedAlertId === alert.id
            const duration = alert.resolvedAt
              ? `${Math.round((new Date(alert.resolvedAt).getTime() - new Date(alert.startedAt).getTime()) / (60 * 1000))} mins`
              : 'Ongoing'

            return (
              <React.Fragment key={alert.id}>
                <tr onClick={() => toggleExpand(alert.id)} className={styles.row}>
                  <td>
                    <strong>{alert.zoneName}</strong>
                    <span className={styles.facilityMeta}>{alert.warehouseName}</span>
                  </td>
                  <td>{alert.startedAt.split(' ')[1]}</td>
                  <td>
                    <span className={alert.status === 'Ongoing' ? styles.ongoingText : ''}>{duration}</span>
                  </td>
                  <td className={styles.deviationVal}>+{alert.peakDeviation}°C</td>
                  <td>
                    <Badge variant={alert.escalationTier === 'Manager' ? 'danger' : 'warning'}>
                      {alert.escalationTier}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.channelsList}>
                      {alert.channelsNotified.map(c => (
                        <span key={c} className={styles.channelBadge}>{getChannelIcon(c)}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge variant={alert.status === 'Ongoing' ? 'danger' : 'success'}>
                      {alert.status}
                    </Badge>
                  </td>
                  <td>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={8} className={styles.timelineExpandedCell}>
                      <div className={styles.timelineBox}>
                        <h5>Breach Escalation Log Checklist</h5>
                        <div className={styles.stepsList}>
                          {getEscalationTimeline(alert).map((step, idx) => (
                            <div key={idx} className={`${styles.stepRow} ${step.done ? styles.stepDone : styles.stepPending}`}>
                              <span className={styles.stepMinutes}>{step.min} min</span>
                              <span className={styles.stepMessage}>{step.msg}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
export default AlertHistoryTab
