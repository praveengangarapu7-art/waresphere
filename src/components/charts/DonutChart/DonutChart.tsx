import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './DonutChart.module.css'

export interface DonutChartSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartSegment[]
  /** Shown in the center of the donut, e.g. a total count. */
  centerLabel?: string
  centerValue?: string | number
  /** Optional — makes each legend row clickable (e.g. to jump a filter to
   * that segment). Purely a UI callback; callers decide what it does. */
  onSegmentClick?: (label: string) => void
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel, centerValue, onSegmentClick }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} SKUs`, name]}
              contentStyle={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '11px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerValue !== undefined) && (
          <div className={styles.centerLabel}>
            <span className={styles.centerValue}>{centerValue}</span>
            {centerLabel && <span className={styles.centerText}>{centerLabel}</span>}
          </div>
        )}
      </div>

      <ul className={styles.legend}>
        {data.map(d => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          const clickable = !!onSegmentClick
          return (
            <li key={d.label}>
              <button
                type="button"
                className={styles.legendRow}
                onClick={() => onSegmentClick?.(d.label)}
                disabled={!clickable}
              >
                <span className={styles.legendDot} style={{ backgroundColor: d.color }} />
                <span className={styles.legendLabel}>{d.label}</span>
                <span className={styles.legendValue}>{d.value}</span>
                <span className={styles.legendPct}>{pct}%</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
export default DonutChart
