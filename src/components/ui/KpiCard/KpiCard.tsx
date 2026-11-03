import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useCountUp } from '../../../hooks/useCountUp'
import styles from './KpiCard.module.css'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  target: string
  className?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  target,
  className = ''
}) => {
  const animatedValue = useCountUp(value, 750)

  const getTrendColor = () => {
    if (trend === 'up') return styles.trendUp
    if (trend === 'down') return styles.trendDown
    return styles.trendNeutral
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight size={14} />
    if (trend === 'down') return <ArrowDownRight size={14} />
    return <Minus size={14} />
  }

  return (
    <div className={`${styles.card} ${className}`}>
      <span className={styles.title}>{title}</span>
      <div className={styles.valueRow}>
        <span className={styles.value}>{animatedValue}</span>
        {change !== undefined && (
          <div className={`${styles.trendBadge} ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <span className={styles.targetLabel}>Target:</span>{' '}
        <span className={styles.targetValue}>{target}</span>
      </div>
    </div>
  )
}
export default KpiCard
