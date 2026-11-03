import React from 'react'
import styles from './AuthCard.module.css'

interface AuthCardProps {
  children: React.ReactNode
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <div className={styles.authCard}>
      {children}
    </div>
  )
}
