import React from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronDown, ArrowRight } from 'lucide-react'
import styles from './AIInsightCard.module.css'

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success'

interface AIInsightCardProps {
  severity: InsightSeverity
  /** Eyebrow label, e.g. "HIGH PRIORITY" */
  label: string
  title: string
  description?: string
  meta?: React.ReactNode
  /** 0–100 confidence score, if the underlying insight has one */
  confidence?: number
  actionLabel?: string
  onAction?: () => void
  /** Expanded detail content, shown when expanded=true */
  children?: React.ReactNode
  expanded?: boolean
  onToggleExpand?: () => void
  className?: string
}

const SEVERITY_ICON: Record<InsightSeverity, React.ReactNode> = {
  critical: <AlertTriangle size={16} />,
  warning: <AlertCircle size={16} />,
  info: <Info size={16} />,
  success: <CheckCircle2 size={16} />
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  severity,
  label,
  title,
  description,
  meta,
  confidence,
  actionLabel,
  onAction,
  children,
  expanded = false,
  onToggleExpand,
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${styles[severity]} ${className}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{SEVERITY_ICON[severity]}</div>
        <div className={styles.headerText}>
          <span className={styles.label}>{label}</span>
          <h4 className={styles.title}>{title}</h4>
        </div>
        {confidence !== undefined && (
          <div className={styles.confidence}>
            <span className={styles.confidenceValue}>{confidence}%</span>
            <span className={styles.confidenceLabel}>confidence</span>
          </div>
        )}
      </div>

      {description && <p className={styles.description}>{description}</p>}
      {meta && <div className={styles.meta}>{meta}</div>}

      {(onToggleExpand || onAction) && (
        <div className={styles.actions}>
          {onToggleExpand && (
            <button className={styles.expandBtn} onClick={onToggleExpand}>
              {expanded ? 'Show less' : 'Show detail'}
              <ChevronDown size={14} className={expanded ? styles.chevronOpen : ''} />
            </button>
          )}
          {actionLabel && onAction && (
            <button className={styles.actionBtn} onClick={onAction}>
              {actionLabel}
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {expanded && children && <div className={styles.detail}>{children}</div>}
    </div>
  )
}
export default AIInsightCard
