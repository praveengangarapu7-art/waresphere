import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts'
import styles from './LineChartCard.module.css'

interface LineChartCardProps {
  data: Array<{
    week: string
    accuracy: number
    otif: number
  }>
}

export const LineChartCard: React.FC<LineChartCardProps> = ({ data }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Accuracy & Fulfillment Trend (12 Weeks)</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="week" 
              stroke="var(--color-text-secondary)" 
              fontSize={10} 
              tickLine={false} 
            />
            <YAxis 
              domain={[80, 100]} 
              stroke="var(--color-text-secondary)" 
              fontSize={10} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-base)', 
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '11px'
              }} 
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} 
            />
            
            {/* Target reference line annotations */}
            <ReferenceLine y={98} stroke="rgba(47, 123, 255, 0.4)" strokeDasharray="3 3" label={{ value: 'Target Acc (>98%)', fill: 'var(--color-primary)', fontSize: 9, position: 'top' }} />
            <ReferenceLine y={95} stroke="rgba(245, 166, 35, 0.4)" strokeDasharray="3 3" label={{ value: 'Target OTIF (>95%)', fill: 'var(--color-accent)', fontSize: 9, position: 'bottom' }} />

            <Line
              type="monotone"
              dataKey="accuracy"
              name="Inventory Accuracy %"
              stroke="var(--color-primary)"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
              animationBegin={0}
            />
            <Line
              type="monotone"
              dataKey="otif"
              name="Fulfillment (OTIF) %"
              stroke="var(--color-accent)"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
              animationBegin={100}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default LineChartCard
