import React from 'react'
import styles from './Tag.module.css'

interface TagProps {
  children?: React.ReactNode
  className?: string
  [key: string]: any
}

export const Tag: React.FC<TagProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.container} ${className}`} {...props}>
      Tag Component Shell
      {children}
    </div>
  )
}
