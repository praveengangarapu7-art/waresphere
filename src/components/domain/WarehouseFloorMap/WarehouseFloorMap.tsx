import React from 'react'
import { Zone } from '../../../mock-data/zones'
import styles from './WarehouseFloorMap.module.css'

interface FloorMapProps {
  zones: Zone[]
  selectedZoneId?: string
  onZoneClick: (zoneId: string) => void
}

export const WarehouseFloorMap: React.FC<FloorMapProps> = ({
  zones,
  selectedZoneId,
  onZoneClick
}) => {
  const getZoneStyles = (zone: Zone) => {
    const isSelected = zone.id === selectedZoneId
    let fillClass = styles.ambientFill
    let strokeClass = styles.ambientStroke

    if (zone.type === 'Cold Storage') {
      fillClass = styles.coldFill
      strokeClass = styles.coldStroke
    } else if (zone.type === 'Hazmat') {
      fillClass = styles.hazmatFill
      strokeClass = styles.hazmatStroke
    }

    return `${styles.zoneRect} ${fillClass} ${strokeClass} ${isSelected ? styles.selected : ''}`
  }

  return (
    <div className={styles.mapContainer}>
      <svg
        viewBox="0 0 160 100"
        className={styles.svgMap}
        width="100%"
        height="100%"
      >
        <defs>
          {/* Diagonal Warning stripes for Hazmat zones */}
          <pattern id="hazmat-stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(245, 166, 35, 0.15)" strokeWidth="3" />
          </pattern>
        </defs>

        {/* Grid Background for industrial blueprint feel */}
        <rect width="160" height="100" fill="var(--color-bg-surface)" rx="4" />
        <g stroke="var(--color-border)" strokeWidth="0.1" opacity="0.4">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`x-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`y-${i}`} x1="0" y1={i * 10} x2="160" y2={i * 10} />
          ))}
        </g>

        {/* Zones Layout */}
        {zones.map(zone => {
          const { x, y, width, height } = zone.layoutPosition
          const isSelected = zone.id === selectedZoneId

          return (
            <g
              key={zone.id}
              onClick={() => onZoneClick(zone.id)}
              className={styles.zoneGroup}
            >
              {/* Main Zone rectangle */}
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="2"
                className={getZoneStyles(zone)}
              />

              {/* Stripe overlay for Hazmat */}
              {zone.type === 'Hazmat' && (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx="2"
                  fill="url(#hazmat-stripes)"
                  className={styles.stripeOverlay}
                />
              )}

              {/* Zone label text */}
              <text
                x={x + width / 2}
                y={y + height / 2 - 2}
                textAnchor="middle"
                className={`${styles.labelTitle} ${isSelected ? styles.selectedText : ''}`}
              >
                {zone.name.split(' ')[0]}
              </text>

              {/* Occupancy stats text */}
              <text
                x={x + width / 2}
                y={y + height / 2 + 5}
                textAnchor="middle"
                className={styles.labelStats}
              >
                {zone.capacityPercent}% Cap
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
export default WarehouseFloorMap
