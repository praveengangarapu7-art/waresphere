import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { inventoryService } from '../../../services/inventoryService'
import { SKU } from '../../../types/sku'
import { formatCurrency } from '../../../utils/formatCurrency'
import styles from './InventoryHereTab.module.css'

interface InventoryHereTabProps {
  warehouseId: string
}

export const InventoryHereTab: React.FC<InventoryHereTabProps> = ({ warehouseId }) => {
  const navigate = useNavigate()
  const [skus, setSkus] = useState<SKU[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSKUs = async () => {
      setLoading(true)
      const data = await inventoryService.getSKUs()
      // Pre-filter by warehouseId
      setSkus(data.filter(s => s.warehouseId === warehouseId))
      setLoading(false)
    }
    fetchSKUs()
  }, [warehouseId])

  const getAbcVariant = (abc: string) => {
    if (abc === 'A') return 'warning'
    if (abc === 'B') return 'primary'
    return 'default'
  }

  const getStatusVariant = (stat: string) => {
    switch (stat) {
      case 'In Stock':
        return 'success'
      case 'Low Stock':
      case 'Expiring Soon':
        return 'warning'
      case 'Out of Stock':
      case 'Expired':
        return 'danger'
      default:
        return 'default'
    }
  }

  const handleRowClick = (id: string) => {
    navigate(`/inventory/${id}`)
  }

  if (loading) {
    return <div className={styles.loading}>Loading inventory ledgers...</div>
  }

  if (skus.length === 0) {
    return (
      <EmptyState
        title="Zero Inventory Stored"
        description="No stock items are currently tracked at this facility."
      />
    )
  }

  return (
    <div className={styles.tabContent}>
      <Table headers={['SKU Code', 'Product Name', 'Category', 'Location Reference', 'Quantity', 'ABC', 'Status', 'Asset Value']}>
        {skus.map(sku => (
          <tr key={sku.id} onClick={() => handleRowClick(sku.id)} className={styles.row}>
            <td className={styles.skuCode}><code>{sku.skuCode}</code></td>
            <td><strong>{sku.name}</strong></td>
            <td>{sku.category}</td>
            <td><code>{sku.zone} · {sku.bin}</code></td>
            <td className={styles.numberCell}>
              <strong>{sku.quantity.toLocaleString('en-IN')}</strong> <span className={styles.unitText}>{sku.unit}</span>
            </td>
            <td>
              <Badge variant={getAbcVariant(sku.abcClass)}>{sku.abcClass}</Badge>
            </td>
            <td>
              <Badge variant={getStatusVariant(sku.status)}>{sku.status}</Badge>
            </td>
            <td className={styles.numberCell}>
              <strong>{formatCurrency(sku.totalValue)}</strong>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
export default InventoryHereTab
