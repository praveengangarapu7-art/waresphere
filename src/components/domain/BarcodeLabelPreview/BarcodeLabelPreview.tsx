import React, { useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import styles from './BarcodeLabelPreview.module.css'

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'GS1-128' | 'QR'

export interface LabelField {
  skuCode?: string
  productName?: string
  batchNumber?: string
  expiryDate?: string
  warehouseName?: string
  binLocation?: string
}

interface BarcodeLabelPreviewProps {
  /** The value to encode (SKU code, bin code, batch ID, etc.) */
  value: string
  format: BarcodeFormat
  /** Optional label metadata to render below the barcode */
  fields?: LabelField
  /** Fields to show, in order */
  visibleFields?: string[]
  /** Show logo placeholder */
  showLogo?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Label dimensions (inches) — controls aspect ratio */
  widthIn?: number
  heightIn?: number
}

// EAN-13 requires exactly 12 digits (the 13th is checksum)
function sanitizeEAN13(value: string): string {
  const digits = value.replace(/\D/g, '').padEnd(12, '0').slice(0, 12)
  return digits
}

function sanitizeCode39(value: string): string {
  // Code 39 only supports A-Z, 0-9, and: - . $ / + % SPACE
  return value.toUpperCase().replace(/[^A-Z0-9\-\.\$\/\+\% ]/g, '').slice(0, 43)
}

const BarcodeRenderer: React.FC<{ value: string; format: BarcodeFormat; size: 'sm' | 'md' | 'lg' }> = ({
  value,
  format,
  size,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  const barHeight = size === 'sm' ? 28 : size === 'md' ? 40 : 55
  const fontSize  = size === 'sm' ? 7  : size === 'md' ? 9  : 11

  useEffect(() => {
    if (!svgRef.current || format === 'QR') return
    try {
      let encoded = value
      let jsFormat: string = format

      if (format === 'EAN13') {
        encoded = sanitizeEAN13(value)
        jsFormat = 'EAN13'
      } else if (format === 'CODE39') {
        encoded = sanitizeCode39(value) || 'UNKNOWN'
        jsFormat = 'CODE39'
      } else if (format === 'GS1-128') {
        jsFormat = 'CODE128'
      }

      JsBarcode(svgRef.current, encoded || 'UNKNOWN', {
        format: jsFormat,
        height: barHeight,
        fontSize,
        margin: 4,
        background: '#ffffff',
        lineColor: '#1A1F26',
        displayValue: true,
        fontOptions: '',
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 2,
        valid: () => true,
      })
    } catch {
      // Silently fail on invalid values for preview
    }
  }, [value, format, barHeight, fontSize])

  if (format === 'QR') {
    const qrSize = size === 'sm' ? 60 : size === 'md' ? 80 : 110
    return (
      <QRCodeSVG
        value={value || 'WARESPHERE'}
        size={qrSize}
        bgColor="#ffffff"
        fgColor="#1A1F26"
        level="M"
        includeMargin={false}
      />
    )
  }

  return <svg ref={svgRef} className={styles.barcodeSvg} />
}

export const BarcodeLabelPreview: React.FC<BarcodeLabelPreviewProps> = ({
  value,
  format,
  fields = {},
  visibleFields = ['Logo', 'Barcode', 'SKU Code', 'Product Name'],
  showLogo = false,
  size = 'md',
  widthIn = 4,
  heightIn = 2,
}) => {
  const show = (field: string) => visibleFields.includes(field)

  return (
    <div
      className={styles.label}
      style={{ aspectRatio: `${widthIn} / ${heightIn}` }}
      data-size={size}
    >
      {/* Logo */}
      {(show('Logo') || showLogo) && (
        <div className={styles.logoRow}>
          <img src="/logo.png" alt="WareSphere" className={styles.logoImg} />
        </div>
      )}

      {/* Barcode / QR */}
      {(show('Barcode') || show('QR Code')) && (
        <div className={styles.barcodeRow}>
          <BarcodeRenderer value={value} format={format} size={size} />
        </div>
      )}

      {/* Text fields */}
      <div className={styles.fieldsGrid}>
        {show('SKU Code') && fields.skuCode && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>SKU</span>
            <span className={styles.fieldValue}>{fields.skuCode}</span>
          </div>
        )}
        {show('Product Name') && fields.productName && (
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Product</span>
            <span className={styles.fieldValue}>{fields.productName}</span>
          </div>
        )}
        {show('Batch Number') && fields.batchNumber && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Batch</span>
            <span className={styles.fieldValue}>{fields.batchNumber}</span>
          </div>
        )}
        {show('Expiry Date') && fields.expiryDate && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Expiry</span>
            <span className={styles.fieldValue}>{fields.expiryDate}</span>
          </div>
        )}
        {show('Warehouse Name') && fields.warehouseName && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>WH</span>
            <span className={styles.fieldValue}>{fields.warehouseName}</span>
          </div>
        )}
        {show('Bin Location') && fields.binLocation && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Bin</span>
            <span className={styles.fieldValue}>{fields.binLocation}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BarcodeLabelPreview
