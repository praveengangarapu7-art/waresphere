import React from 'react'
import styles from './Breadcrumbs.module.css'

export const Breadcrumbs: React.FC = () => {
  return (
    <nav className={styles.container}>
      <span>WareSphere</span> / <span>Current Page</span>
    </nav>
  )
}
