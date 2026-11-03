import React from 'react'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { SkuBatch } from '../../../types/sku'
import styles from './TabsContent.module.css'

interface BatchGenealogyTabProps {
  batches?: SkuBatch[]
  unit: string
}

export const BatchGenealogyTab: React.FC<BatchGenealogyTabProps> = ({
  batches = [],
  unit
}) => {
  const getQualityBadgeVariant = (status: SkuBatch['qualityStatus']) => {
    if (status === 'Accepted') return 'success'
    if (status === 'Held') return 'warning'
    return 'danger'
  }

  if (batches.length === 0) {
    return <div className={styles.empty}>No batch or lot records found for this SKU.</div>
  }

  return (
    <div className={styles.tabContent}>
      <Table
        headers={[
          'Batch / Lot Code',
          'Serial Code',
          'Origin / Source GRN',
          'Received Date',
          'Quality Release',
          'Remaining Stock',
          'Expiry Date'
        ]}
      >
        {batches.map((b, i) => (
          <tr key={i}>
            <td>
              <div className={styles.batchCell}>
                <strong>{b.batchNumber}</strong>
                {b.lotNumber && <span className={styles.lotText}>{b.lotNumber}</span>}
              </div>
            </td>
            <td>{b.serialNumber ? <code>{b.serialNumber}</code> : '—'}</td>
            <td>
              <div className={styles.sourceCell}>
                <span>{b.source}</span>
              </div>
            </td>
            <td>{b.receivedDate}</td>
            <td>
              <Badge variant={getQualityBadgeVariant(b.qualityStatus)}>
                {b.qualityStatus}
              </Badge>
            </td>
            <td className={styles.numberCell}>
              <strong>{b.quantityRemaining.toLocaleString('en-IN')}</strong> {unit}
            </td>
            <td>{b.expiryDate || '—'}</td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
export default BatchGenealogyTab
