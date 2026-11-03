import React from 'react'
import { Loader2 } from 'lucide-react'
import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className={styles.spinner} /> : icon}
      {children}
    </button>
  )
}
export default Button
