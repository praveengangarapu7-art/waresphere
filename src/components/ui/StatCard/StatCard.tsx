import React from 'react'
import { useCountUp } from '../../../hooks/useCountUp'
import styles from './StatCard.module.css'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  variant?: 'default' | 'warning' | 'danger'
  description?: string
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = 'default',
  description,
  className = ''
}) => {
  const animatedValue = useCountUp(value, 700)

  return (
    <div className={`${styles.card} ${styles[variant]} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>
      <span className={styles.value}>{animatedValue}</span>
      {description && <span className={styles.description}>{description}</span>}
    </div>
  )
}
export default StatCard
