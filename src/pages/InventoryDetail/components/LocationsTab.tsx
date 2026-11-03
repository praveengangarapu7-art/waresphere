import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/ui/Table/Table'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { SkuLocation } from '../../../types/sku'
import styles from './TabsContent.module.css'

interface LocationsTabProps {
  locations?: SkuLocation[]
  unit: string
  isAuditor?: boolean
}

export const LocationsTab: React.FC<LocationsTabProps> = ({
  locations = [],
  unit,
  isAuditor = false
}) => {
  const navigate = useNavigate()

  const totalQty = locations.reduce((sum, loc) => sum + loc.quantity, 0)

  const getWarehouseName = (id: string) => {
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name : id
  }

  const handleRowClick = (warehouseId: string) => {
    if (!isAuditor) {
      navigate(`/warehouses/${warehouseId}`)
    }
  }

  if (locations.length === 0) {
    return <div className={styles.empty}>No location records found for this SKU.</div>
  }

  return (
    <div className={styles.tabContent}>
      <Table headers={['Warehouse Name', 'Zone', 'Rack/Shelf/Bin', 'Batch Reference', 'Quantity']}>
        {locations.map(loc => (
          <tr key={loc.id} onClick={() => handleRowClick(loc.warehouseId)} className={styles.clickableRow}>
            <td><strong>{getWarehouseName(loc.warehouseId)}</strong></td>
            <td>{loc.zone}</td>
            <td><code>{loc.bin}</code></td>
            <td><code>{loc.batchNumber}</code></td>
            <td className={styles.numberCell}>
              <strong>{loc.quantity.toLocaleString('en-IN')}</strong> {unit}
            </td>
          </tr>
        ))}
      </Table>
      <div className={styles.sumFooter}>
        <span>Consolidated Stock:</span>
        <strong>{totalQty.toLocaleString('en-IN')} {unit}</strong>
      </div>
    </div>
  )
}
export default LocationsTab
