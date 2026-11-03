import React from 'react'
import styles from './Table.module.css'

interface TableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.trHead}>
            {headers.map((h, i) => (
              <th key={i} className={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {children}
        </tbody>
      </table>
    </div>
  )
}
export default Table
