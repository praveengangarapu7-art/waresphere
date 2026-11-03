import React from 'react'
import { ColdStorageZone } from '../../../types/coldStorage'
import { Thermometer, Droplets } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import styles from './ColdStorageZoneCard.module.css'

interface ColdStorageZoneCardProps {
  zone: ColdStorageZone
  onClick: () => void
}

export const ColdStorageZoneCard: React.FC<ColdStorageZoneCardProps> = ({
  zone,
  onClick
}) => {
  const getStatusColor = (status: ColdStorageZone['status']) => {
    switch (status) {
      case 'In Range': return '#10b981' // Green
      case 'Warning': return '#f5a623' // Amber
      case 'Critical': return '#ef4444' // Red
      default: return 'var(--color-text-secondary)'
    }
  }

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.warehouse}>{zone.warehouseName}</span>
          <h4 className={styles.zoneName}>{zone.zoneName}</h4>
        </div>
        <div className={styles.statusCol}>
          <span
            className={styles.statusDot}
            style={{ backgroundColor: getStatusColor(zone.status) }}
          />
          <span className={styles.statusText} style={{ color: getStatusColor(zone.status) }}>
            {zone.status}
          </span>
        </div>
      </div>

      <div className={styles.readings}>
        <div className={styles.readCol}>
          <div className={styles.iconRow}>
            <Thermometer size={16} className={styles.tempIcon} />
            <span>Temperature</span>
          </div>
          <strong className={styles.mainVal}>{zone.currentReading.temp}°C</strong>
          <span className={styles.targetBand}>
            Target: {zone.targetRange.min}°C – {zone.targetRange.max}°C
          </span>
        </div>

        <div className={styles.readCol} style={{ borderLeft: '1px solid var(--color-border)' }}>
          <div className={styles.iconRow}>
            <Droplets size={16} className={styles.humidIcon} />
            <span>Humidity</span>
          </div>
          <strong className={styles.mainVal}>{zone.currentReading.humidity}%</strong>
          <span className={styles.targetBand}>Ambient Zone</span>
        </div>
      </div>

      {/* 24h Embedded Sparkline area */}
      <div className={styles.sparklineBox}>
        <ResponsiveContainer width="100%" height={32}>
          <AreaChart data={zone.history24h} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getStatusColor(zone.status)} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={getStatusColor(zone.status)} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="temp"
              stroke={getStatusColor(zone.status)}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#grad-${zone.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.footer}>
        <span>Updated {zone.currentReading.timestamp}</span>
      </div>
    </div>
  )
}
export default ColdStorageZoneCard
