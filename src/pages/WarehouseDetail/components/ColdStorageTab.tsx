import React, { useState } from 'react'
import { Zone } from '../../../mock-data/zones'
import { AlertBanner } from '../../../components/domain/AlertBanner/AlertBanner'
import { Thermometer, Droplets, BatteryCharging, Radio, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts'
import styles from './ColdStorageTab.module.css'

interface ColdStorageTabProps {
  warehouseId: string
  zones: Zone[]
}

export const ColdStorageTab: React.FC<ColdStorageTabProps> = ({
  warehouseId,
  zones
}) => {
  const coldZones = zones.filter(z => z.type === 'Cold Storage')
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    coldZones.length > 0 ? coldZones[0].id : ''
  )

  const activeZone = coldZones.find(z => z.id === selectedZoneId)

  // 24-hour temperature history mock series
  const tempHistory = [
    { time: '10:00 AM', temp: 4.1, humidity: 62 },
    { time: '12:00 PM', temp: 4.3, humidity: 61 },
    { time: '02:00 PM', temp: 4.5, humidity: 60 },
    { time: '04:00 PM', temp: 5.2, humidity: 63 }, // slight elevation
    { time: '06:00 PM', temp: 4.8, humidity: 64 },
    { time: '08:00 PM', temp: 4.1, humidity: 62 },
    { time: '10:00 PM', temp: 3.9, humidity: 60 },
    { time: '12:00 AM', temp: 3.8, humidity: 59 },
    { time: '02:00 AM', temp: 4.0, humidity: 61 },
    { time: '04:00 AM', temp: 4.1, humidity: 62 },
    { time: '06:00 AM', temp: 4.2, humidity: 62 },
    { time: '08:00 AM', temp: 4.3, humidity: 63 }
  ]

  // Scoped Mock Alerts list
  const coldAlerts = [
    { type: 'cold-storage' as const, message: 'Sensor node #CS-MUM-01 reported battery status below 15%', timestamp: '1 hour ago', severity: 'warning' as const },
    { type: 'cold-storage' as const, message: 'Minor temperature variation warning: Cold Room C-04 hit 5.2°C (Target max 5°C)', timestamp: '3 hours ago', severity: 'warning' as const }
  ]

  if (coldZones.length === 0) {
    return <div className={styles.empty}>This facility does not support Cold Chain storage profiles.</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        {/* Zone selection dropdown */}
        <div className={styles.selectorBar}>
          <label htmlFor="cold-zone-select" className={styles.label}>Select IoT Chamber Sensor:</label>
          <select
            id="cold-zone-select"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className={styles.select}
          >
            {coldZones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>

        {activeZone && (
          <div className={styles.sensorGrid}>
            {/* Temperature Sensor Card */}
            <div className={styles.sensorCard}>
              <div className={styles.sensorCardHeader}>
                <Thermometer size={18} className={styles.iconTemp} />
                <span>Ambient Temperature</span>
              </div>
              <span className={styles.sensorVal}>4.2°C</span>
              <span className={styles.sensorTarget}>Target Range: 2.0°C - 8.0°C</span>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${styles.good}`}>In Range</span>
              </div>
            </div>

            {/* Humidity Sensor Card */}
            <div className={styles.sensorCard}>
              <div className={styles.sensorCardHeader}>
                <Droplets size={18} className={styles.iconHumid} />
                <span>Relative Humidity</span>
              </div>
              <span className={styles.sensorVal}>62%</span>
              <span className={styles.sensorTarget}>Target Range: 55% - 65%</span>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${styles.good}`}>Optimal</span>
              </div>
            </div>

            {/* Signal & Battery Health */}
            <div className={styles.sensorCard}>
              <div className={styles.sensorCardHeader}>
                <Radio size={18} className={styles.iconSignal} />
                <span>Node Telemetry Status</span>
              </div>
              <div className={styles.telemetryRow}>
                <div className={styles.telItem}>
                  <BatteryCharging size={14} className={styles.iconBattery} />
                  <span>Battery: <strong>88%</strong></span>
                </div>
                <div className={styles.telItem}>
                  <span>Signal strength: <strong>Excellent</strong></span>
                </div>
              </div>
              <span className={styles.sensorTarget}>Last heartbeat: 10 seconds ago</span>
            </div>
          </div>
        )}

        {/* 24 Hour Temperature Line Chart */}
        <div className={styles.chartCard}>
          <span className={styles.chartTitle}>Temperature Logs (24h Trend)</span>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempHistory} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="var(--color-text-secondary)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '10px'
                  }}
                />
                <ReferenceLine y={5.0} stroke="rgba(245, 166, 35, 0.4)" strokeDasharray="3 3" label={{ value: 'Max Threshold (5°C)', fill: 'var(--color-accent)', fontSize: 8, position: 'top' }} />
                <Line type="monotone" dataKey="temp" name="Temperature (°C)" stroke="var(--color-cyan)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scoped Alerts Side Column */}
      <div className={styles.rightCol}>
        <div className={styles.alertsHeader}>
          <h4>Recent Sensor Alerts</h4>
        </div>
        <div className={styles.alertsList}>
          {coldAlerts.map((alert, i) => (
            <AlertBanner
              key={i}
              type={alert.type}
              message={alert.message}
              timestamp={alert.timestamp}
              severity={alert.severity}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
export default ColdStorageTab
