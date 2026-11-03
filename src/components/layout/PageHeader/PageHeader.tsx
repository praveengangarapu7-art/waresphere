import React from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  /** Small uppercase label above the title, e.g. "Inventory Intelligence".
   * Optional — existing pages that don't pass one render exactly as before. */
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => {
  return (
    <div className={styles.container}>
      <div>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
