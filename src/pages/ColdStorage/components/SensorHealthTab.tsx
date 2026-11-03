import React, { useState } from 'react'
import { ColdStorageZone } from '../../../types/coldStorage'
import { Table } from '../../../components/ui/Table/Table'
import { Badge } from '../../../components/ui/Badge/Badge'
import { AlertTriangle, Battery, RefreshCw } from 'lucide-react'
import { coldStorageService } from '../../../services/coldStorageService'
import styles from './SensorHealthTab.module.css'

interface SensorHealthTabProps {
  zones: ColdStorageZone[]
  onRefresh: () => void
}

export const SensorHealthTab: React.FC<SensorHealthTabProps> = ({
  zones,
  onRefresh
}) => {
  const [reconnectingSensorId, setReconnectingSensorId] = useState<string | null>(null)
  const [replacingBatteryId, setReplacingBatteryId] = useState<string | null>(null)

  // Flatten sensors from all zones
  const sensorFleet = zones.flatMap(zone => 
    zone.sensors.map(s => ({
      ...s,
      zoneName: zone.zoneName,
      zoneId: zone.id,
      warehouseName: zone.warehouseName
    }))
  )

  const handleReconnect = async (zoneId: string, sensorId: string) => {
    setReconnectingSensorId(sensorId)
    await coldStorageService.reconnectSensor(zoneId, sensorId)
    onRefresh()
    setReconnectingSensorId(null)
    alert(`Sensor ${sensorId} has been successfully re-calibrated and reconnected.`)
  }

  const handleReplaceBattery = async (zoneId: string, sensorId: string) => {
    setReplacingBatteryId(sensorId)
    await coldStorageService.replaceBattery(zoneId, sensorId)
    onRefresh()
    setReplacingBatteryId(null)
    alert(`Battery replaced for Sensor ${sensorId} — now at 100%.`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.statsStrip}>
        <div className={styles.metricItem}>
          <span>Sensors Online</span>
          <strong>{sensorFleet.filter(s => s.connectivity === 'Online').length}</strong>
        </div>
        <div className={styles.metricItem} style={{ borderLeft: '1px solid var(--color-border)' }}>
          <span>Offline Sensors</span>
          <strong className={sensorFleet.some(s => s.connectivity === 'Offline') ? styles.dangerText : ''}>
            {sensorFleet.filter(s => s.connectivity === 'Offline').length}
          </strong>
        </div>
        <div className={styles.metricItem} style={{ borderLeft: '1px solid var(--color-border)' }}>
          <span>Low Battery ( &lt; 20% )</span>
          <strong>{sensorFleet.filter(s => s.batteryPercent < 20).length}</strong>
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table headers={['Sensor ID', 'Model', 'Assigned Location', 'Battery Capacity', 'Connectivity', 'Last Heartbeat', 'Actions']}>
          {sensorFleet.map(sensor => {
            const isLowBattery = sensor.batteryPercent < 20
            const isOffline = sensor.connectivity === 'Offline'

            return (
              <tr key={sensor.id} className={isOffline ? styles.offlineRow : ''}>
                <td>
                  <strong>{sensor.id}</strong>
                </td>
                <td>{sensor.model}</td>
                <td>
                  <span>{sensor.zoneName}</span>
                  <span className={styles.facilityMeta}>{sensor.warehouseName}</span>
                </td>
                <td>
                  <div className={styles.batteryCell}>
                    <Battery size={14} className={isLowBattery ? styles.dangerText : ''} />
                    <span className={isLowBattery ? styles.dangerText : ''}>{sensor.batteryPercent}%</span>
                    {isLowBattery && (
                      <span className={styles.lowWarn}>
                        <AlertTriangle size={10} />
                        <span>Low</span>
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <Badge variant={isOffline ? 'danger' : 'success'}>
                    {sensor.connectivity}
                  </Badge>
                </td>
                <td>{sensor.lastReading}</td>
                <td>
                  <div className={styles.actionsCell}>
                    {isOffline ? (
                      <button
                        onClick={() => handleReconnect(sensor.zoneId, sensor.id)}
                        disabled={reconnectingSensorId === sensor.id}
                        className={styles.btnReconnect}
                      >
                        <RefreshCw size={12} className={reconnectingSensorId === sensor.id ? styles.spin : ''} />
                        <span>{reconnectingSensorId === sensor.id ? 'Connecting...' : 'Reconnect'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReplaceBattery(sensor.zoneId, sensor.id)}
                        disabled={replacingBatteryId === sensor.id}
                        className={styles.btnAction}
                        style={{ opacity: isLowBattery ? 1 : 0.6 }}
                      >
                        {replacingBatteryId === sensor.id ? 'Replacing...' : 'Replace Battery'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
export default SensorHealthTab
