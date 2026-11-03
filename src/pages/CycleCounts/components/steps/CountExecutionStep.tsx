import React, { useState } from 'react'
import { CycleCount } from '../../../../types/cycleCount'
import { Table } from '../../../../components/ui/Table/Table'
import { EyeOff, Scan, CheckCircle, Lock } from 'lucide-react'
import styles from './Steps.module.css'

interface CountExecutionStepProps {
  count: CycleCount
  onChange: (updated: CycleCount) => void
}

export const CountExecutionStep: React.FC<CountExecutionStepProps> = ({
  count,
  onChange,
}) => {
  // Which bins have had their barcode simulated-scanned
  const [scannedBins, setScannedBins] = useState<Record<string, boolean>>(
    count.items.reduce((acc, item) => {
      // Pre-scan bins that already have a countedQty (resuming an in-progress count)
      acc[item.bin] = item.countedQty !== undefined
      return acc
    }, {} as Record<string, boolean>)
  )

  const handleScan = (bin: string) => {
    setScannedBins(prev => ({ ...prev, [bin]: true }))
  }

  const handleQtyChange = (bin: string, val: number) => {
    const updatedItems = count.items.map(item => {
      if (item.bin !== bin) return item
      const varQty  = val - item.systemQty
      const varPct  = item.systemQty > 0
        ? parseFloat(((varQty / item.systemQty) * 100).toFixed(2))
        : 0
      return {
        ...item,
        countedQty:      val,
        varianceQty:     varQty,
        variancePercent: varPct,
      }
    })
    onChange({ ...count, items: updatedItems })
  }

  const countedCount  = count.items.filter(i => i.countedQty !== undefined).length
  const totalBins     = count.items.length
  const allCounted    = countedCount === totalBins
  const progressPct   = totalBins > 0 ? Math.round((countedCount / totalBins) * 100) : 0

  return (
    <div className={styles.stepContainer}>
      <div className={styles.headerWithAction}>
        <h3 className={styles.stepTitle}>Step 2 — Physical Count Execution</h3>
        <span className={styles.progressText}>
          {countedCount} / {totalBins} bins counted
        </span>
      </div>

      {/* Blind count banner — prominent visual reminder */}
      {count.isBlindCount && (
        <div className={styles.blindBanner}>
          <EyeOff size={16} className={styles.blindBannerIcon} />
          <div>
            <strong>Blind Count Mode Active</strong>
            <p>System stock quantities are hidden to prevent bias. Count what you physically see, not what you expect.</p>
          </div>
          <Lock size={14} className={styles.lockIcon} />
        </div>
      )}

      {/* Progress bar */}
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className={styles.progressPct}>{progressPct}%</span>
      </div>

      {/* Count table */}
      <div className={styles.section}>
        <Table
          headers={[
            '#',
            'Bin Location',
            'SKU',
            count.isBlindCount ? 'System Qty' : 'System Qty',
            'Scan',
            'Physical Count Entered',
          ]}
        >
          {count.items.map((item, idx) => {
            const isScanned = scannedBins[item.bin]
            const isDone    = item.countedQty !== undefined

            return (
              <tr key={idx} className={isDone ? styles.rowDone : ''}>
                <td className={styles.idxCell}>{idx + 1}</td>
                <td>
                  <code className={styles.binCode}>{item.bin}</code>
                </td>
                <td>
                  <code className={styles.skuCode}>SKU-{item.skuId.padStart(3, '0')}</code>
                </td>
                <td>
                  {count.isBlindCount ? (
                    /* ── BLIND COUNT: system qty locked behind icon ── */
                    <div className={styles.hiddenQtyCell}>
                      <div className={styles.hiddenQty}>
                        <EyeOff size={11} />
                        <span>Hidden</span>
                      </div>
                      <span className={styles.hiddenHint}>revealed in Step 3</span>
                    </div>
                  ) : (
                    <span className={styles.qtyDisplay}>{item.systemQty.toLocaleString('en-IN')}</span>
                  )}
                </td>
                <td>
                  {isScanned ? (
                    <span className={styles.scannedBadge}>
                      <CheckCircle size={11} />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScan(item.bin)}
                      className={styles.btnScan}
                    >
                      <Scan size={11} />
                      Scan Bin
                    </button>
                  )}
                </td>
                <td>
                  {isScanned ? (
                    <div className={styles.qtyInputWrapper}>
                      <input
                        type="number"
                        value={item.countedQty ?? ''}
                        onChange={e => handleQtyChange(item.bin, Number(e.target.value))}
                        placeholder="Enter count"
                        className={`${styles.qtyInput} ${isDone ? styles.qtyInputDone : ''}`}
                        min={0}
                      />
                      {isDone && <CheckCircle size={13} className={styles.doneCheck} />}
                    </div>
                  ) : (
                    <span className={styles.scanFirst}>Scan bin first</span>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      </div>

      {/* Completion state */}
      {allCounted && (
        <div className={styles.successBlock}>
          <CheckCircle size={16} />
          <span>All {totalBins} bins have been counted. Ready to proceed to Variance Review.</span>
        </div>
      )}
    </div>
  )
}

export default CountExecutionStep
