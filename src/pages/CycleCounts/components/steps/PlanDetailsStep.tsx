import React from 'react'
import { CycleCount } from '../../../../types/cycleCount'
import { Table } from '../../../../components/ui/Table/Table'
import { Badge } from '../../../../components/ui/Badge/Badge'
import {
  EyeOff,
  Eye,
  Building2,
  CalendarDays,
  User,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import styles from './Steps.module.css'
import { mockWarehouses } from '../../../../mock-data/warehouses'

interface PlanDetailsStepProps {
  count: CycleCount
}

const strategyVariant = (s: CycleCount['strategy']) => {
  switch (s) {
    case 'ABC-Based':               return 'primary' as const
    case 'Zone-Based':              return 'info' as const
    case 'Random Sampling':         return 'secondary' as const
    case 'Event-Triggered':         return 'warning' as const
    case 'Full Physical Inventory': return 'danger' as const
    default:                        return 'default' as const
  }
}

export const PlanDetailsStep: React.FC<PlanDetailsStepProps> = ({ count }) => {
  const warehouseName = mockWarehouses.find(w => w.id === count.warehouseId)?.name || count.warehouseId
  const isFullPhysical = count.strategy === 'Full Physical Inventory'

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 1 — Count Plan Specifications</h3>

      {/* Full Physical Inventory warning */}
      {isFullPhysical && (
        <div className={styles.fpiWarning}>
          <AlertTriangle size={16} />
          <div>
            <strong>Transaction Freeze Active</strong>
            <p>This Full Physical Inventory count may pause inbound/outbound stock transactions at <strong>{warehouseName}</strong> for its duration. All dispatch and receipt operations are placed on hold.</p>
          </div>
        </div>
      )}

      {/* Summary grid */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><Layers size={11} /> Strategy</span>
          <Badge variant={strategyVariant(count.strategy)}>{count.strategy}</Badge>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><Layers size={11} /> Scope</span>
          <strong className={styles.summaryValue}>{count.scopeLabel}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><Building2 size={11} /> Warehouse</span>
          <strong className={styles.summaryValue}>{warehouseName}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><User size={11} /> Assigned Counter</span>
          <strong className={styles.summaryValue}>{count.assignedTo}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><CalendarDays size={11} /> Scheduled Date</span>
          <strong className={styles.summaryValue}>{count.scheduledDate}</strong>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.sumLabel}><EyeOff size={11} /> Blind Count</span>
          <div className={styles.blindIndicator}>
            {count.isBlindCount ? (
              <>
                <EyeOff size={13} className={styles.warnIcon} />
                <span>Enabled — system quantities hidden from counter</span>
              </>
            ) : (
              <>
                <Eye size={13} className={styles.successIcon} />
                <span>Disabled — counter can see expected quantities</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blind count info callout */}
      {count.isBlindCount && (
        <div className={styles.blindCallout}>
          <EyeOff size={14} />
          <span>
            <strong>Blind Count Protocol:</strong> System stock quantities are concealed from the counter in this audit to prevent
            confirmation bias. Quantities will only be revealed in Step 3 (Variance Review) after physical
            counting is complete.
          </span>
        </div>
      )}

      {/* Bin/item list */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          Inventory Audit List ({count.items.length} {count.items.length === 1 ? 'bin' : 'bins'})
        </h4>
        <Table headers={['#', 'SKU ID', 'Bin Location', count.isBlindCount ? 'System Qty (Hidden)' : 'System Qty']}>
          {count.items.map((item, idx) => (
            <tr key={idx}>
              <td className={styles.idxCell}>{idx + 1}</td>
              <td>
                <code className={styles.skuCode}>SKU-{item.skuId.padStart(3, '0')}</code>
              </td>
              <td>
                <code className={styles.binCode}>{item.bin}</code>
              </td>
              <td>
                {count.isBlindCount ? (
                  <div className={styles.hiddenQty}>
                    <EyeOff size={11} />
                    <span>Hidden during blind count</span>
                  </div>
                ) : (
                  <span className={styles.qtyDisplay}>
                    {item.systemQty.toLocaleString('en-IN')} units
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}

export default PlanDetailsStep
