import React, { useMemo } from 'react'
import { CycleCount } from '../../../../types/cycleCount'
import { Table } from '../../../../components/ui/Table/Table'
import { formatCurrency } from '../../../../utils/formatCurrency'
import { AlertCircle, CheckCircle, Eye, TrendingDown, TrendingUp } from 'lucide-react'
import styles from './Steps.module.css'

interface VarianceReviewStepProps {
  count: CycleCount
}

// Thresholds: >5% variance OR >₹1,000 absolute value = breach
// >15% OR >₹5,000 = critical
const PCT_WARN      = 5.0
const PCT_CRITICAL  = 15.0
const VAL_WARN      = 1000   // ₹1,000
const VAL_CRITICAL  = 5000   // ₹5,000
const UNIT_RATE     = 150    // ~₹150 avg unit rate for variance valuation

function classifyLine(
  varianceQty: number | undefined,
  variancePercent: number | undefined,
): 'ok' | 'warn' | 'critical' {
  const absQty = Math.abs(varianceQty || 0)
  const absPct = Math.abs(variancePercent || 0)
  const absVal = absQty * UNIT_RATE

  if (absPct > PCT_CRITICAL || absVal > VAL_CRITICAL) return 'critical'
  if (absPct > PCT_WARN     || absVal > VAL_WARN)     return 'warn'
  return 'ok'
}

// Intensity 0–1 based on how far beyond threshold the variance is
function varIntensity(absPct: number): number {
  if (absPct === 0) return 0
  if (absPct <= PCT_WARN)     return absPct / PCT_WARN * 0.4        // 0–0.4
  if (absPct <= PCT_CRITICAL) return 0.4 + (absPct - PCT_WARN) / (PCT_CRITICAL - PCT_WARN) * 0.4  // 0.4–0.8
  return Math.min(0.8 + (absPct - PCT_CRITICAL) / 20 * 0.2, 1)     // 0.8–1.0
}

export const VarianceReviewStep: React.FC<VarianceReviewStepProps> = ({ count }) => {
  const totalVarianceValue = useMemo(() =>
    count.items.reduce((acc, i) => acc + Math.abs(i.varianceQty || 0) * UNIT_RATE, 0),
  [count])

  const overallAccuracy = useMemo(() => {
    const sysSum = count.items.reduce((a, i) => a + i.systemQty, 0)
    const varSum = count.items.reduce((a, i) => a + Math.abs(i.varianceQty || 0), 0)
    if (sysSum === 0) return 100
    return parseFloat(((sysSum - varSum) / sysSum * 100).toFixed(2))
  }, [count])

  const breachCount = count.items.filter(i =>
    classifyLine(i.varianceQty, i.variancePercent) !== 'ok'
  ).length

  const criticalCount = count.items.filter(i =>
    classifyLine(i.varianceQty, i.variancePercent) === 'critical'
  ).length

  return (
    <div className={styles.stepContainer}>
      <h3 className={styles.stepTitle}>Step 3 — Variance Discrepancy Review</h3>

      {/* Thresholds info */}
      <div className={styles.thresholdInfo}>
        <span>Tolerance thresholds applied:</span>
        <span className={styles.thresholdTag}>≤ 5% variance</span>
        <span className={styles.thresholdAnd}>&amp;</span>
        <span className={styles.thresholdTag}>≤ ₹1,000 value</span>
        <span className={styles.thresholdAnd}>→ both must be met to be within SLA</span>
      </div>

      {/* Summary stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Eye size={11} /> Audit Accuracy (this count)
          </span>
          <strong className={overallAccuracy >= 98 ? styles.successText : overallAccuracy >= 95 ? styles.warnText : styles.criticalText}>
            {overallAccuracy}%
          </strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Discrepancy Value</span>
          <strong>{formatCurrency(totalVarianceValue)}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Lines in Breach</span>
          <strong className={breachCount > 0 ? styles.warnText : styles.successText}>
            {breachCount} / {count.items.length}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Critical Lines</span>
          <strong className={criticalCount > 0 ? styles.criticalText : styles.successText}>
            {criticalCount}
          </strong>
        </div>
      </div>

      {/* Line-by-line table */}
      <div className={styles.section}>
        <Table headers={['#', 'Bin', 'SKU', 'System Qty', 'Counted Qty', 'Variance (±)', 'Variance %', 'Est. Value', 'Severity']}>
          {count.items.map((item, idx) => {
            const classification = classifyLine(item.varianceQty, item.variancePercent)
            const absPct   = Math.abs(item.variancePercent || 0)
            const intensity = varIntensity(absPct)
            const varValue  = Math.abs(item.varianceQty || 0) * UNIT_RATE

            // Progressive background tint based on intensity
            const rowBg = classification === 'critical'
              ? `rgba(239, 68, 68, ${intensity * 0.12})`
              : classification === 'warn'
                ? `rgba(245, 166, 35, ${intensity * 0.12})`
                : 'transparent'

            return (
              <tr key={idx} style={{ backgroundColor: rowBg }}>
                <td className={styles.idxCell}>{idx + 1}</td>
                <td><code className={styles.binCode}>{item.bin}</code></td>
                <td><code className={styles.skuCode}>SKU-{item.skuId.padStart(3, '0')}</code></td>
                <td>{item.systemQty.toLocaleString('en-IN')}</td>
                <td>{item.countedQty !== undefined ? item.countedQty.toLocaleString('en-IN') : '—'}</td>

                {/* Variance qty with direction indicator */}
                <td>
                  <div className={styles.varianceCell}>
                    {item.varianceQty !== undefined && item.varianceQty !== 0 ? (
                      <>
                        {item.varianceQty < 0
                          ? <TrendingDown size={12} className={styles.negIcon} />
                          : <TrendingUp   size={12} className={styles.posIcon} />}
                        <span className={item.varianceQty < 0 ? styles.negValue : styles.posValue}>
                          {item.varianceQty > 0 ? '+' : ''}{item.varianceQty.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className={styles.zeroValue}>0</span>
                    )}
                  </div>
                </td>

                {/* Variance % */}
                <td>
                  <span className={
                    classification === 'critical' ? styles.negValue :
                    classification === 'warn'     ? styles.warnValue : styles.zeroValue
                  }>
                    {item.variancePercent !== undefined
                      ? `${item.variancePercent > 0 ? '+' : ''}${item.variancePercent.toFixed(2)}%`
                      : '—'}
                  </span>
                </td>

                {/* Estimated ₹ value */}
                <td className={classification !== 'ok' ? styles.warnText : ''}>
                  {varValue > 0 ? formatCurrency(varValue) : '—'}
                </td>

                {/* Severity tag */}
                <td>
                  {classification === 'critical' ? (
                    <span className={styles.criticalTag}>
                      <AlertCircle size={10} /> Critical
                    </span>
                  ) : classification === 'warn' ? (
                    <span className={styles.warningTag}>
                      <AlertCircle size={10} /> Breach
                    </span>
                  ) : (
                    <span className={styles.okTag}>
                      <CheckCircle size={10} /> Within SLA
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      </div>

      {/* Total variance summary row */}
      <div className={styles.varianceTotalRow}>
        <span>Total Variance Value Across Count:</span>
        <strong className={totalVarianceValue > VAL_CRITICAL ? styles.criticalText : totalVarianceValue > VAL_WARN ? styles.warnText : styles.successText}>
          {formatCurrency(totalVarianceValue)}
        </strong>
      </div>
    </div>
  )
}

export default VarianceReviewStep
