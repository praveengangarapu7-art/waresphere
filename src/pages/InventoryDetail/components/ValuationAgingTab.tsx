import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts'
import { SkuValuationHistory, SkuBatch } from '../../../types/sku'
import { formatCurrency } from '../../../utils/formatCurrency'
import styles from './ValuationAgingTab.module.css'

interface ValuationAgingTabProps {
  valuationMethod: string
  unitCost: number
  totalValue: number
  valuationHistory?: SkuValuationHistory[]
  batches?: SkuBatch[]
  unit: string
}

export const ValuationAgingTab: React.FC<ValuationAgingTabProps> = ({
  valuationMethod,
  unitCost,
  totalValue,
  valuationHistory = [],
  batches = [],
  unit
}) => {
  
  // Calculate Stock Aging Buckets dynamically
  const agingData = useMemo(() => {
    let b0_30 = 0
    let b30_60 = 0
    let b60_90 = 0
    let b90_plus = 0

    const today = new Date()
    batches.forEach(b => {
      const received = new Date(b.receivedDate)
      const diffTime = today.getTime() - received.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 30) b0_30 += b.quantityRemaining
      else if (diffDays <= 60) b30_60 += b.quantityRemaining
      else if (diffDays <= 90) b60_90 += b.quantityRemaining
      else b90_plus += b.quantityRemaining
    })

    return [
      { label: '0-30 Days', value: b0_30 },
      { label: '30-60 Days', value: b30_60 },
      { label: '60-90 Days', value: b60_90 },
      { label: '90+ Days', value: b90_plus }
    ]
  }, [batches])

  const chartDataValuation = valuationHistory.map(h => ({
    label: h.month,
    cost: h.cost
  }))

  const has90PlusWarning = agingData[3].value > 0

  return (
    <div className={styles.container}>
      {/* Valuation Profile Card */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h4>Inventory Valuation</h4>
          <span className={styles.valuationBadge}>{valuationMethod} Policy</span>
        </div>
        
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Current Unit Cost</span>
            <span className={styles.kpiVal}>{formatCurrency(unitCost)}</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Total Asset Value</span>
            <span className={styles.kpiVal}>{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className={styles.chartWrapper}>
          <span className={styles.chartTitle}>Unit Cost Trend (6 Months)</span>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartDataValuation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
              <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '10px'
                }}
              />
              <Line type="monotone" dataKey="cost" name="Unit Cost (₹)" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Aging Card */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h4>Stock Aging Histogram</h4>
          {has90PlusWarning && (
            <span className={styles.warningBadge}>Warning: Dead Stock Risk</span>
          )}
        </div>

        <p className={styles.agingDesc}>
          Breakdown of current physical storage duration based on original GRN receipt dates.
        </p>

        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
              <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
              <Tooltip
                formatter={(value: any) => [`${value.toLocaleString()} ${unit}`, 'Quantity']}
                contentStyle={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '10px'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {agingData.map((entry, index) => {
                  // Highlighting the 90+ days bucket in industrial amber if non-zero to flags dead stock risks
                  const fill = index === 3 && entry.value > 0 ? 'var(--color-status-pending)' : 'var(--color-primary)'
                  return <Cell key={`cell-${index}`} fill={fill} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
export default ValuationAgingTab
