import React from 'react'
import { Inbox } from 'lucide-react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <Inbox size={48} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  )
}
export default EmptyState
