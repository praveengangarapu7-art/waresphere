import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { LabelTemplate } from '../../../mock-data/labelTemplates'
import { BarcodeLabelPreview } from '../../../components/domain/BarcodeLabelPreview/BarcodeLabelPreview'
import { Check } from 'lucide-react'
import styles from './TemplateEditorModal.module.css'

const ALL_FIELDS = [
  'Logo',
  'Barcode',
  'QR Code',
  'SKU Code',
  'Product Name',
  'Batch Number',
  'Expiry Date',
  'Warehouse Name',
  'Bin Location',
]

const PRESET_SIZES = [
  { label: '4×2 in (Standard SKU)',     widthIn: 4, heightIn: 2 },
  { label: '4×6 in (Shipping Label)',   widthIn: 4, heightIn: 6 },
  { label: '2×1 in (Bin Label)',        widthIn: 2, heightIn: 1 },
  { label: '3×2 in (Mid-size)',         widthIn: 3, heightIn: 2 },
  { label: 'Custom',                    widthIn: 0, heightIn: 0 },
]

interface TemplateEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tmpl: Omit<LabelTemplate, 'id'>) => void
  initialTemplate?: LabelTemplate | null
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}) => {
  const [name,      setName]      = useState('New Template')
  const [sizeIndex, setSizeIndex] = useState(0)
  const [customW,   setCustomW]   = useState(4)
  const [customH,   setCustomH]   = useState(2)
  const [fields,    setFields]    = useState<string[]>(['Barcode', 'SKU Code', 'Product Name'])

  // Load initial values when editing
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name)
      setFields(initialTemplate.fields)
      const found = PRESET_SIZES.findIndex(
        s => s.widthIn === initialTemplate.widthIn && s.heightIn === initialTemplate.heightIn
      )
      if (found >= 0) {
        setSizeIndex(found)
      } else {
        setSizeIndex(PRESET_SIZES.length - 1) // Custom
        setCustomW(initialTemplate.widthIn)
        setCustomH(initialTemplate.heightIn)
      }
    } else {
      setName('New Template')
      setSizeIndex(0)
      setFields(['Barcode', 'SKU Code', 'Product Name'])
    }
  }, [initialTemplate, isOpen])

  const isCustom = sizeIndex === PRESET_SIZES.length - 1
  const widthIn  = isCustom ? customW : PRESET_SIZES[sizeIndex].widthIn
  const heightIn = isCustom ? customH : PRESET_SIZES[sizeIndex].heightIn
  const sizeLabel = isCustom ? `${customW}×${customH} in` : PRESET_SIZES[sizeIndex].label.split(' ')[0]

  const toggleField = (f: string) => {
    setFields(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      sizeLabel,
      widthIn,
      heightIn,
      fields,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialTemplate ? 'Edit Template' : 'Create Label Template'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.twoCol}>
          {/* Left — form */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Template Name *</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Warehouse Bin Label"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Label Size</label>
              <select
                className={styles.select}
                value={sizeIndex}
                onChange={e => setSizeIndex(Number(e.target.value))}
              >
                {PRESET_SIZES.map((s, i) => (
                  <option key={i} value={i}>{s.label}</option>
                ))}
              </select>
            </div>

            {isCustom && (
              <div className={styles.customSizeRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Width (in)</label>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    min={1}
                    max={12}
                    step={0.5}
                    value={customW}
                    onChange={e => setCustomW(Number(e.target.value))}
                  />
                </div>
                <span className={styles.customSep}>×</span>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Height (in)</label>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    min={0.5}
                    max={12}
                    step={0.5}
                    value={customH}
                    onChange={e => setCustomH(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Fields to Include</label>
              <div className={styles.fieldCheckGrid}>
                {ALL_FIELDS.map(f => (
                  <label key={f} className={styles.fieldCheck}>
                    <input
                      type="checkbox"
                      checked={fields.includes(f)}
                      onChange={() => toggleField(f)}
                      className={styles.checkbox}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right — live preview */}
          <div className={styles.previewSection}>
            <p className={styles.previewHint}>Live Preview</p>
            <div className={styles.previewWrapper} style={{ aspectRatio: `${widthIn} / ${heightIn}` }}>
              <BarcodeLabelPreview
                value="SKU-PREVIEW-001"
                format="CODE128"
                fields={{
                  skuCode: 'SKU-001',
                  productName: 'Sample Product',
                  batchNumber: 'BATCH-2026-001',
                  expiryDate: '2027-06-30',
                  warehouseName: 'Mumbai Hub',
                  binLocation: 'Zone A · Bin A-01',
                }}
                visibleFields={fields}
                widthIn={widthIn}
                heightIn={heightIn}
                size={widthIn <= 2 ? 'sm' : widthIn >= 4 && heightIn >= 5 ? 'lg' : 'md'}
              />
            </div>
            <p className={styles.previewSize}>{widthIn}″ × {heightIn}″</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancel</button>
          <button type="submit" className={styles.btnPrimary}>
            <Check size={14} />
            {initialTemplate ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TemplateEditorModal
