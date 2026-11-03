import React, { useState, useEffect } from 'react'
import { WarehouseFloorMap } from '../../../components/domain/WarehouseFloorMap/WarehouseFloorMap'
import { Zone } from '../../../mock-data/zones'
import { Thermometer, Layers, AlertCircle } from 'lucide-react'
import styles from './FloorMapTab.module.css'

interface FloorMapTabProps {
  zones: Zone[]
}

export const FloorMapTab: React.FC<FloorMapTabProps> = ({ zones }) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined)

  // Default to first zone
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id)
    }
  }, [zones, selectedZoneId])

  const selectedZone = zones.find(z => z.id === selectedZoneId)

  return (
    <div className={styles.container}>
      {/* Floor Map Graphic View */}
      <div className={styles.mapPanel}>
        <WarehouseFloorMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZoneClick={setSelectedZoneId}
        />
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.colorBox} ${styles.ambient}`} />
            <span>Ambient Storage</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.colorBox} ${styles.cold}`} />
            <span>Cold Storage Room</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.colorBox} ${styles.hazmat}`} />
            <span>Hazardous Vault</span>
          </div>
        </div>
      </div>

      {/* Selected Zone Side Details Panel */}
      <div className={styles.detailsPanel}>
        {selectedZone ? (
          <div className={styles.detailsCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.zoneName}>{selectedZone.name}</h3>
              <span className={`${styles.typeBadge} ${styles[selectedZone.type.replace(' ', '').toLowerCase()]}`}>
                {selectedZone.type}
              </span>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.metric}>
                <span className={styles.label}>Capacity Utilization</span>
                <div className={styles.progressRow}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ 
                        width: `${selectedZone.capacityPercent}%`,
                        backgroundColor: selectedZone.capacityPercent > 80 ? 'var(--color-status-pending)' : 'var(--color-primary)' 
                      }} 
                    />
                  </div>
                  <strong>{selectedZone.capacityPercent}%</strong>
                </div>
              </div>

              {selectedZone.type === 'Cold Storage' && selectedZone.tempRange && (
                <div className={styles.sensorRow}>
                  <Thermometer size={16} className={styles.sensorIcon} />
                  <div className={styles.sensorText}>
                    <span className={styles.label}>Current Reading</span>
                    <strong>4.2°C (Target {selectedZone.tempRange.min}°C - {selectedZone.tempRange.max}°C)</strong>
                  </div>
                </div>
              )}

              <div className={styles.statsGrid}>
                <div className={styles.statCell}>
                  <Layers size={14} className={styles.statIcon} />
                  <div className={styles.statInfo}>
                    <span className={styles.label}>Racks / Shelves</span>
                    <strong>{selectedZone.racksCount} / {selectedZone.racksCount * 3}</strong>
                  </div>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.label}>Total Bins</span>
                  <strong>{selectedZone.binsCount}</strong>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.label}>Unique SKUs</span>
                  <strong>{selectedZone.skuCount}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} />
            <p>Select a zone rectangle on the floor map to display capacity parameters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
export default FloorMapTab
