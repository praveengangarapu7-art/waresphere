import React from 'react'
import styles from './Card.module.css'

interface CardProps {
  children?: React.ReactNode
  className?: string
  /** 'default' = standard surface. 'elevated' = higher surface tier (use
   * sparingly, for content that should read as "on top of" other cards).
   * 'glow' = subtle AI-accent glow border — reserve for genuinely
   * important AI-surfaced content (Copilot, key insights), never decorative. */
  variant?: 'default' | 'elevated' | 'glow'
  /** Disables the hover lift — use for cards that aren't interactive. */
  interactive?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  interactive = true,
  onClick,
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${interactive ? styles.interactive : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
export default Card
