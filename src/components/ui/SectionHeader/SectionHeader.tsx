import React from 'react'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  /** Small uppercase label above the title, e.g. "AI INSIGHTS" */
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * In-page section header — distinct from PageHeader (the top-of-page H1).
 * Used to introduce sub-sections within a page (e.g. "Inventory Trend",
 * "Recent Activity") with consistent scale/spacing.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
export default SectionHeader
