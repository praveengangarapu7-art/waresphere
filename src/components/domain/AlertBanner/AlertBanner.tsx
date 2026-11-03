import React from 'react'
import { AlertTriangle, Package, ArrowLeftRight, Thermometer, Info } from 'lucide-react'
import styles from './AlertBanner.module.css'

interface AlertBannerProps {
  type: 'cold-storage' | 'low-stock' | 'transfer' | 'cycle-count'
  message: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  timestamp,
  severity
}) => {
  const getIcon = () => {
    switch (type) {
      case 'cold-storage':
        return <Thermometer size={16} className={styles.iconCold} />
      case 'low-stock':
        return <Package size={16} className={styles.iconStock} />
      case 'transfer':
        return <ArrowLeftRight size={16} className={styles.iconTransfer} />
      case 'cycle-count':
        return <AlertTriangle size={16} className={styles.iconCount} />
      default:
        return <Info size={16} />
    }
  }

  const getSeverityClass = () => {
    if (severity === 'critical') return styles.critical
    if (severity === 'warning') return styles.warning
    return styles.info
  }

  return (
    <div className={`${styles.banner} ${getSeverityClass()}`}>
      <div className={styles.iconWrapper}>{getIcon()}</div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <span className={styles.timestamp}>{timestamp}</span>
      </div>
      <span className={`${styles.badge} ${styles[severity]}`}>{severity}</span>
    </div>
  )
}
export default AlertBanner
