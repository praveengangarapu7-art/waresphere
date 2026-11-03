import React from 'react'
import { Table } from '../../../components/ui/Table/Table'
import { User, Shield, Briefcase } from 'lucide-react'
import styles from './TeamTab.module.css'

interface TeamTabProps {
  managerName: string
  staffCount: number
}

export const TeamTab: React.FC<TeamTabProps> = ({ managerName, staffCount }) => {
  const supervisors = [
    { name: 'Karan Malhotra', area: 'Dry Racking Zone A', shift: 'Morning Shift' },
    { name: 'Meera Deshmukh', area: 'Cold Room Zone C', shift: 'Morning Shift' },
    { name: 'Sanjay Dutt', area: 'Receiving Dock & Packing', shift: 'Night Shift' }
  ]

  return (
    <div className={styles.container}>
      {/* Manager Card */}
      <div className={styles.managerSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Briefcase size={18} className={styles.icon} />
            <span>Facility Operations Manager</span>
          </div>
          <div className={styles.managerInfo}>
            <div className={styles.avatar}>
              <User size={24} />
            </div>
            <div>
              <h4 className={styles.managerName}>{managerName}</h4>
              <span className={styles.managerTitle}>Operations Director reporting line</span>
            </div>
          </div>
        </div>

        {/* Staff count stats */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Briefcase size={18} className={styles.icon} />
            <span>Roster Headcount</span>
          </div>
          <span className={styles.staffCount}>{staffCount} Employees</span>
          <span className={styles.staffMeta}>Distributed across 2 active shifts (General, Night)</span>
        </div>
      </div>

      {/* Supervisors Table */}
      <div className={styles.supervisorsSection}>
        <div className={styles.sectionHeader}>
          <Shield size={16} className={styles.sectionIcon} />
          <h4>Floor Supervisors</h4>
        </div>
        <Table headers={['Supervisor Name', 'Assigned Oversight Area', 'Active Shift Roster']}>
          {supervisors.map((s, i) => (
            <tr key={i}>
              <td><strong>{s.name}</strong></td>
              <td>{s.area}</td>
              <td>{s.shift}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
export default TeamTab
