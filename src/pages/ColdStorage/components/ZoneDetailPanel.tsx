import React from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { ColdStorageZone } from '../../../types/coldStorage'
import { Thermometer, Droplets, Battery, Radio, ShieldCheck } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea
} from 'recharts'
import styles from './ZoneDetailPanel.module.css'

interface ZoneDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  zone: ColdStorageZone | null
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  isOpen,
  onClose,
  zone
}) => {
  if (!isOpen || !zone) return null

  // Calculate min, max, avg for the 24h period
  const history = zone.history24h
  const temps = history.map(h => h.temp)
  const humidities = history.map(h => h.humidity)

  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const avgTemp = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1))

  const minHumid = Math.min(...humidities)
  const maxHumid = Math.max(...humidities)
  const avgHumid = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Telemetry Insights: ${zone.zoneName}`}
    >
      <div className={styles.container}>
        {/* Statistics Tiles */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg Temperature</span>
            <strong className={styles.statVal}>{avgTemp}°C</strong>
            <span className={styles.statMeta}>Min: {minTemp}°C / Max: {maxTemp}°C</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg Humidity</span>
            <strong className={styles.statVal}>{avgHumid}%</strong>
            <span className={styles.statMeta}>Min: {minHumid}% / Max: {maxHumid}%</span>
          </div>
        </div>

        {/* 24h Trend Chart with Shaded ReferenceArea Target */}
        <div className={styles.chartSection}>
          <h4 className={styles.sectionTitle}>24-Hour Environmental Logs</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="timestamp" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '10px'
                  }}
                />
                {/* Target Range Shaded Area */}
                <ReferenceArea
                  y1={zone.targetRange.min}
                  y2={zone.targetRange.max}
                  fill="rgba(99, 102, 241, 0.05)"
                  stroke="rgba(99, 102, 241, 0.2)"
                  strokeDasharray="3 3"
                />
                <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SKU Classes & Sensor Health */}
        <div className={styles.detailsSplit}>
          {/* SKU Ranges */}
          <div className={styles.col}>
            <h4 className={styles.sectionTitle}>Stored Material Profiles</h4>
            <div className={styles.skuList}>
              {zone.skuClasses.map((sku, idx) => (
                <div key={idx} className={styles.skuItem}>
                  <ShieldCheck size={14} className={styles.shieldIcon} />
                  <span>{sku.name}</span>
                  <strong>{sku.range.min}°C to {sku.range.max}°C</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Sensors */}
          <div className={styles.col}>
            <h4 className={styles.sectionTitle}>Associated IoT Sensors</h4>
            <div className={styles.sensorList}>
              {zone.sensors.map((sensor) => (
                <div key={sensor.id} className={styles.sensorItem}>
                  <Radio size={14} className={sensor.connectivity === 'Online' ? styles.iconOnline : styles.iconOffline} />
                  <div className={styles.sensorMeta}>
                    <span>{sensor.id} (Model {sensor.model})</span>
                    <div className={styles.sensorRow}>
                      <span className={`${styles.statusBadge} ${sensor.connectivity === 'Online' ? styles.online : styles.offline}`}>
                        {sensor.connectivity}
                      </span>
                      <span className={styles.batteryText}>
                        <Battery size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} />
                        {sensor.batteryPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
export default ZoneDetailPanel
