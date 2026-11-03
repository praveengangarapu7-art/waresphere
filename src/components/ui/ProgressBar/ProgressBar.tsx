import React from 'react'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  children?: React.ReactNode
  className?: string
  [key: string]: any
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.container} ${className}`} {...props}>
      ProgressBar Component Shell
      {children}
    </div>
  )
}
