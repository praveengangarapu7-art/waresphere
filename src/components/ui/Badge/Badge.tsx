import React from 'react'
import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'info' | 'success' | 'secondary'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
export default Badge
