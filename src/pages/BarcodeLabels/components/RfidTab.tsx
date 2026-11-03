import React, { useState } from 'react'
import { mockRfidTags, RfidTag } from '../../../mock-data/rfidTags'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Table } from '../../../components/ui/Table/Table'
import { Radio, Zap, MapPin, Clock, AlertTriangle } from 'lucide-react'
import styles from './RfidTab.module.css'

const statusVariant = (status: RfidTag['status']) => {
  if (status === 'Active')   return 'success' as const
  if (status === 'Missing')  return 'danger'  as const
  return 'secondary' as const
}

export const RfidTab: React.FC = () => {
  const [tags] = useState<RfidTag[]>(mockRfidTags)

  const activeCount  = tags.filter(t => t.status === 'Active').length
  const missingCount = tags.filter(t => t.status === 'Missing').length

  const getWarehouseName = (id: string) =>
    mockWarehouses.find(w => w.id === id)?.name || id

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className={styles.container}>
      {/* Preview-tier banner */}
      <div className={styles.previewBanner}>
        <div className={styles.bannerLeft}>
          <Zap size={16} className={styles.bannerIcon} />
          <div>
            <strong>RFID Tracking — Advanced Tier Preview</strong>
            <p>
              RFID-level tracking is an advanced capability requiring UHF reader infrastructure
              and EPC tag provisioning. The data below shows a preview of what the RFID integration
              surface will look like. Reader deployment and real-time zone tracking are not included
              in the current tier.
            </p>
          </div>
        </div>
        <span className={styles.previewChip}>Preview</span>
      </div>

      {/* Mini stat row */}
      <div className={styles.statsRow}>
        <div className={styles.statTile}>
          <Radio size={16} className={styles.statIcon} />
          <span className={styles.statVal}>{tags.length}</span>
          <span className={styles.statLabel}>Tags Registered</span>
        </div>
        <div className={styles.statTile}>
          <MapPin size={16} className={styles.statIcon} />
          <span className={styles.statVal}>{activeCount}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statTile}>
          <AlertTriangle size={16} className={styles.statIconWarn} />
          <span className={`${styles.statVal} ${missingCount > 0 ? styles.statValWarn : ''}`}>{missingCount}</span>
          <span className={styles.statLabel}>Missing</span>
        </div>
      </div>

      {/* RFID tag table */}
      <div className={styles.tableCard}>
        <Table headers={['Tag ID', 'Associated SKU / Pallet', 'Warehouse', 'Last Read Location', 'Last Read Time', 'Status']}>
          {tags.map(tag => (
            <tr key={tag.id} className={tag.status === 'Missing' ? styles.missingRow : ''}>
              <td>
                <code className={styles.tagCode}>{tag.tagId}</code>
              </td>
              <td className={styles.skuCell}>{tag.associatedSku}</td>
              <td className={styles.warehouseCell}>{getWarehouseName(tag.warehouseId)}</td>
              <td>
                <div className={styles.locationCell}>
                  <MapPin size={11} />
                  <span>{tag.lastReadLocation}</span>
                </div>
              </td>
              <td>
                <div className={styles.timeCell}>
                  <Clock size={11} />
                  <span>{formatTime(tag.lastReadTime)}</span>
                </div>
              </td>
              <td>
                <Badge variant={statusVariant(tag.status)}>{tag.status}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}

export default RfidTab
