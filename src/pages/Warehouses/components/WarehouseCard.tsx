import React from 'react'
import { useNavigate } from 'react-router-dom'
import { WarehouseFloorPlanThumbnail } from './WarehouseFloorPlanThumbnail'
import { Badge } from '../../../components/ui/Badge/Badge'
import { Warehouse } from '../../../types/warehouse'
import { Thermometer, Bell } from 'lucide-react'
import styles from './WarehouseCard.module.css'

interface WarehouseCardProps {
  warehouse: Warehouse
}

export const WarehouseCard: React.FC<WarehouseCardProps> = ({ warehouse }) => {
  const navigate = useNavigate()

  // Healthy range is 75-85% (per spec)
  const isHealthyUtilization = warehouse.utilizationPercent >= 75 && warehouse.utilizationPercent <= 85

  const handleCardClick = () => {
    navigate(`/warehouses/${warehouse.id}`)
  }

  const getTypeVariant = (type: Warehouse['type']) => {
    if (type === 'Cold Chain') return 'info'
    if (type === '3PL') return 'secondary'
    return 'primary'
  }

  return (
    <div className={styles.card} onClick={handleCardClick} role="button" tabIndex={0}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.name}>{warehouse.name}</h3>
          <span className={styles.location}>{warehouse.city}, {warehouse.state}</span>
        </div>
        <div className={styles.indicators}>
          <span className={`${styles.statusDot} ${warehouse.status === 'Active' ? styles.active : styles.maintenance}`} />
        </div>
      </div>

      {/* SVG floor-plan thumbnail */}
      <div className={styles.thumbnailWrapper}>
        <WarehouseFloorPlanThumbnail coldStorageEnabled={warehouse.coldStorageEnabled} />
      </div>

      {/* Utilization progress bar */}
      <div className={styles.utilizationSection}>
        <div className={styles.utilizationHeader}>
          <span className={styles.utilizationLabel}>Utilization</span>
          <span className={`${styles.utilizationValue} ${isHealthyUtilization ? styles.healthyText : styles.warningText}`}>
            {warehouse.utilizationPercent}%
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div 
            className={`${styles.progressFill} ${isHealthyUtilization ? styles.healthyFill : styles.warningFill}`} 
            style={{ width: `${warehouse.utilizationPercent}%` }} 
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Zones</span>
          <strong className={styles.statVal}>{warehouse.zonesCount}</strong>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Racks</span>
          <strong className={styles.statVal}>{warehouse.racksCount}</strong>
        </div>
        {warehouse.openAlertsCount > 0 ? (
          <div className={`${styles.stat} ${styles.alertStat}`}>
            <span className={styles.statLabel}>Alerts</span>
            <span className={styles.alertBadge}>
              <Bell size={10} />
              <span>{warehouse.openAlertsCount}</span>
            </span>
          </div>
        ) : (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Alerts</span>
            <strong className={styles.statVal}>0</strong>
          </div>
        )}
      </div>

      {/* Footer Tags */}
      <div className={styles.footer}>
        <Badge variant={getTypeVariant(warehouse.type)}>{warehouse.type}</Badge>
        {warehouse.coldStorageEnabled && (
          <div className={styles.coldIndicator} title="Cold Storage Available">
            <Thermometer size={14} />
            <span>Cold Storage</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default WarehouseCard
