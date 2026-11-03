import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts'
import styles from './BarChartCard.module.css'

interface BarChartCardProps {
  title: string
  data: Array<{
    label: string
    value: number
  }>
  isSingleWarehouse?: boolean
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  data,
  isSingleWarehouse = false
}) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="label" 
              stroke="var(--color-text-secondary)" 
              fontSize={10} 
              tickLine={false} 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--color-text-secondary)" 
              fontSize={10} 
              tickLine={false} 
            />
            <Tooltip 
              formatter={(value: any) => [`${value}%`, 'Utilization']}
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-base)', 
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '11px'
              }} 
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive
              animationDuration={450}
              animationEasing="ease-out"
              animationBegin={0}
            >
              {data.map((entry, index) => {
                // Alternating brand colors for design richness
                const color = isSingleWarehouse 
                  ? 'var(--color-primary)' 
                  : (index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-accent)')
                return <Cell key={`cell-${index}`} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default BarChartCard
