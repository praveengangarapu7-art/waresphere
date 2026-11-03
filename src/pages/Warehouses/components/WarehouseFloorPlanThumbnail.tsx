import React from 'react'

interface ThumbnailProps {
  coldStorageEnabled: boolean
}

export const WarehouseFloorPlanThumbnail: React.FC<ThumbnailProps> = ({
  coldStorageEnabled
}) => {
  return (
    <svg
      viewBox="0 0 160 80"
      width="100%"
      height="80"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: '4px',
        border: '1px solid var(--color-border)',
        display: 'block'
      }}
    >
      {/* Abstract Dry Racking Zone 1 */}
      <rect x="8" y="8" width="40" height="24" rx="2" fill="rgba(47, 123, 255, 0.15)" stroke="var(--color-primary)" strokeWidth="0.5" />
      <line x1="16" y1="8" x2="16" y2="32" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="28" y1="8" x2="28" y2="32" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="40" y1="8" x2="40" y2="32" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />

      {/* Abstract Dry Racking Zone 2 */}
      <rect x="8" y="38" width="40" height="24" rx="2" fill="rgba(47, 123, 255, 0.15)" stroke="var(--color-primary)" strokeWidth="0.5" />
      <line x1="16" y1="38" x2="16" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="28" y1="38" x2="28" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="40" y1="38" x2="40" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />

      {/* Cold Chamber Chamber / Racking Zone 3 */}
      {coldStorageEnabled ? (
        <g>
          {/* Cyan for cold chain chamber */}
          <rect x="56" y="8" width="46" height="54" rx="2" fill="rgba(34, 211, 238, 0.08)" stroke="var(--color-cyan)" strokeWidth="0.75" />
          <text x="79" y="36" fill="var(--color-cyan)" fontSize="6" fontWeight="bold" textAnchor="middle">COLD ZONE</text>
          <rect x="62" y="14" width="34" height="6" rx="1" fill="rgba(34, 211, 238, 0.15)" />
          <rect x="62" y="44" width="34" height="6" rx="1" fill="rgba(34, 211, 238, 0.15)" />
        </g>
      ) : (
        <g>
          {/* Dry Racking 3 */}
          <rect x="56" y="8" width="46" height="54" rx="2" fill="rgba(47, 123, 255, 0.15)" stroke="var(--color-primary)" strokeWidth="0.5" />
          <line x1="68" y1="8" x2="68" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1="80" y1="8" x2="80" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1="92" y1="8" x2="92" y2="62" stroke="var(--color-primary)" strokeWidth="0.5" strokeDasharray="1 1" />
        </g>
      )}

      {/* Inbound / Sorting Area */}
      <rect x="110" y="8" width="42" height="24" rx="2" fill="var(--color-bg-hover)" stroke="var(--color-border)" strokeWidth="0.5" />
      <circle cx="131" cy="20" r="4" fill="var(--color-accent)" opacity="0.3" />
      <text x="131" y="22" fill="var(--color-text-secondary)" fontSize="5" fontWeight="bold" textAnchor="middle">PACKING</text>

      {/* Dock Doors Area */}
      <rect x="110" y="38" width="42" height="24" rx="2" fill="rgba(245, 166, 35, 0.08)" stroke="var(--color-accent)" strokeWidth="0.5" />
      <rect x="116" y="44" width="8" height="12" fill="var(--color-accent)" opacity="0.25" rx="1" />
      <rect x="128" y="44" width="8" height="12" fill="var(--color-accent)" opacity="0.25" rx="1" />
      <rect x="140" y="44" width="8" height="12" fill="var(--color-accent)" opacity="0.25" rx="1" />
      <text x="131" y="52" fill="var(--color-accent)" fontSize="5" fontWeight="bold" textAnchor="middle">DOCKS</text>

      {/* Grid Lines Overlay for industrial texture */}
      <line x1="0" y1="72" x2="160" y2="72" stroke="var(--color-border)" strokeWidth="0.25" />
      <line x1="8" y1="0" x2="8" y2="80" stroke="var(--color-border)" strokeWidth="0.25" />
    </svg>
  )
}
export default WarehouseFloorPlanThumbnail
