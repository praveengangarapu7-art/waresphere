import React from 'react'
import styles from './Dropdown.module.css'

interface DropdownProps {
  children?: React.ReactNode
  className?: string
  [key: string]: any
}

export const Dropdown: React.FC<DropdownProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.container} ${className}`} {...props}>
      Dropdown Component Shell
      {children}
    </div>
  )
}
