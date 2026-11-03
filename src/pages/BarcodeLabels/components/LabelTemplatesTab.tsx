import React, { useState } from 'react'
import { LabelTemplate, mockLabelTemplates } from '../../../mock-data/labelTemplates'
import { BarcodeLabelPreview } from '../../../components/domain/BarcodeLabelPreview/BarcodeLabelPreview'
import { TemplateEditorModal } from './TemplateEditorModal'
import { Plus, Edit2, Trash2, Star, Check } from 'lucide-react'
import styles from './LabelTemplatesTab.module.css'

const FIELD_DESCRIPTIONS: Record<string, string> = {
  'Logo':          'Company logo/branding mark',
  'Barcode':       'Linear barcode (format from Generate tab)',
  'QR Code':       'QR code (links to product info)',
  'SKU Code':      'Unique stock keeping unit identifier',
  'Product Name':  'Full product/item name',
  'Batch Number':  'Batch or lot reference',
  'Expiry Date':   'Product expiry / best-before date',
  'Warehouse Name':'Origin facility name',
  'Bin Location':  'Specific bin/rack location code',
}

export const LabelTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<LabelTemplate[]>(mockLabelTemplates)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null)

  const handleSave = (tmpl: Omit<LabelTemplate, 'id'>) => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...tmpl, id: editingTemplate.id } : t))
    } else {
      const newId = `tmpl-${Date.now()}`
      setTemplates(prev => [...prev, { ...tmpl, id: newId }])
    }
    setIsEditorOpen(false)
    setEditingTemplate(null)
  }

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const handleEdit = (tmpl: LabelTemplate) => {
    setEditingTemplate(tmpl)
    setIsEditorOpen(true)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Label Templates</h3>
          <p className={styles.subtitle}>Define reusable label layouts for different printing scenarios.</p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => { setEditingTemplate(null); setIsEditorOpen(true) }}
        >
          <Plus size={15} />
          Create Template
        </button>
      </div>

      <div className={styles.gallery}>
        {templates.map(tmpl => (
          <div key={tmpl.id} className={styles.card}>
            {tmpl.isDefault && (
              <div className={styles.defaultBadge}>
                <Star size={10} /> Default
              </div>
            )}

            {/* Mini label mockup */}
            <div className={styles.mockupArea} style={{ aspectRatio: `${tmpl.widthIn} / ${tmpl.heightIn}` }}>
              <BarcodeLabelPreview
                value={`WH-SKU-${tmpl.id.toUpperCase()}`}
                format="CODE128"
                fields={{
                  skuCode: 'SKU-001',
                  productName: 'Sample Product Name',
                  batchNumber: 'BATCH-001',
                  expiryDate: '2027-06-30',
                  warehouseName: 'Mumbai Hub',
                  binLocation: 'Zone A · Bin A-01',
                }}
                visibleFields={tmpl.fields}
                widthIn={tmpl.widthIn}
                heightIn={tmpl.heightIn}
                size={tmpl.widthIn <= 2 ? 'sm' : tmpl.widthIn >= 4 && tmpl.heightIn >= 5 ? 'lg' : 'md'}
              />
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardName}>{tmpl.name}</div>
              <div className={styles.cardSize}>{tmpl.sizeLabel}</div>

              <div className={styles.fieldsList}>
                {tmpl.fields.map(f => (
                  <span key={f} className={styles.fieldChip} title={FIELD_DESCRIPTIONS[f]}>
                    <Check size={9} />
                    {f}
                  </span>
                ))}
              </div>

              <div className={styles.cardActions}>
                <button className={styles.btnEdit} onClick={() => handleEdit(tmpl)}>
                  <Edit2 size={13} /> Edit
                </button>
                {!tmpl.isDefault && (
                  <button className={styles.btnDelete} onClick={() => handleDelete(tmpl.id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingTemplate(null) }}
        onSave={handleSave}
        initialTemplate={editingTemplate}
      />
    </div>
  )
}

export default LabelTemplatesTab
