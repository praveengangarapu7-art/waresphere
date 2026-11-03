import React, { useMemo } from 'react'
import { MaintenanceItem } from '../../../types/coldStorage'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { CalendarRange, Plus } from 'lucide-react'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './MaintenanceTab.module.css'

interface MaintenanceTabProps {
  items: MaintenanceItem[]
  onOpenSchedule: () => void
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  items,
  onOpenSchedule
}) => {
  // Sort by next-due-date ascending (overdue items surface first)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
  }, [items])

  const getWarehouseName = (id?: string) => {
    if (!id) return '—'
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  const getStatusBadgeVariant = (status: MaintenanceItem['status']) => {
    switch (status) {
      case 'Overdue': return 'danger'
      case 'Due Soon': return 'warning'
      case 'On Schedule': return 'success'
      default: return 'secondary'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerMeta}>
          <CalendarRange size={16} className={styles.maintIcon} />
          <h4>Preventive Cooling Maintenance Log</h4>
        </div>
        <button onClick={onOpenSchedule} className={styles.btnPrimary}>
          <Plus size={14} />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      <div className={styles.tableCard}>
        <Table headers={['Equipment Name', 'Type', 'Facility Location', 'Last Serviced', 'Next Service Due', 'Status', 'Assigned Vendor']}>
          {sortedItems.map(item => (
            <tr key={item.id}>
              <td>
                <strong>{item.equipmentName}</strong>
              </td>
              <td>
                <Badge variant="secondary">{item.type}</Badge>
              </td>
              <td>{getWarehouseName(item.warehouseId)}</td>
              <td>{item.lastServicedDate}</td>
              <td className={item.status === 'Overdue' ? styles.overdueText : ''}>
                <strong>{item.nextDueDate}</strong>
              </td>
              <td>
                <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
              </td>
              <td>{item.vendor}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
export default MaintenanceTab
