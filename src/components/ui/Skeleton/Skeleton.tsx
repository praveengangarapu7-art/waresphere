import React from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  className?: string
  /** 'text' = a single text-line bar. 'block' = a rectangular area (e.g. a
   * card or chart placeholder). 'circle' = an avatar/icon placeholder. */
  variant?: 'text' | 'block' | 'circle'
  width?: string | number
  height?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height
}) => {
  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
export default Skeleton
