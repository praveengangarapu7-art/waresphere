import React, { useState, useMemo, useRef } from 'react'
import { BarcodeLabelPreview, BarcodeFormat } from '../../../components/domain/BarcodeLabelPreview/BarcodeLabelPreview'
import { mockLabelTemplates } from '../../../mock-data/labelTemplates'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { mockZones } from '../../../mock-data/zones'
import { Search, Plus, Minus, Printer, ChevronDown, X, Info } from 'lucide-react'
import styles from './GenerateLabelsTab.module.css'

// ── Pull SKUs from the procedural generator
import { mockSKUs } from '../../../mock-data/skus'

// ── Mock batch data (no dedicated mock file — generate inline)
const mockBatches = [
  { id: 'bat-001', code: 'BATCH-PHR-2026-001', name: 'Amoxicillin 500mg — Batch Jan 2026', expiry: '2027-01-15' },
  { id: 'bat-002', code: 'BATCH-PHR-2026-002', name: 'Paracetamol Syrup — Batch Mar 2026', expiry: '2028-03-20' },
  { id: 'bat-003', code: 'BATCH-FMC-2026-001', name: 'Basmati Rice 25kg — Batch Apr 2026', expiry: '2026-10-01' },
  { id: 'bat-004', code: 'BATCH-CHM-2026-001', name: 'IPA Industrial — Batch Feb 2026', expiry: '2028-02-28' },
  { id: 'bat-005', code: 'BATCH-FMC-2026-002', name: 'Organic Honey 500g — Batch May 2026', expiry: '2028-05-10' },
  { id: 'bat-006', code: 'BATCH-AGR-2026-001', name: 'NPK 19:19:19 — Batch Jun 2026', expiry: '2028-06-30' },
  { id: 'bat-007', code: 'BATCH-AUT-2026-001', name: 'Brake Pad Set — Batch Jul 2026', expiry: undefined },
  { id: 'bat-008', code: 'BATCH-PHR-2026-003', name: 'Metformin 500mg — Batch Feb 2026', expiry: '2027-02-15' },
]

// ── Bin locations from zones
const mockBins = mockZones.slice(0, 12).map((z, i) => ({
  id: `bin-${i}`,
  code: `${z.warehouseId.toUpperCase()}-${z.name.slice(0, 4).toUpperCase().replace(/\s/g, '')}-R${(i % 3) + 1}-B${(i % 4) + 1}`,
  name: `${z.name} · Rack R${(i % 3) + 1} · Bin B${(i % 4) + 1}`,
  warehouseId: z.warehouseId,
}))

type EntityType = 'SKU' | 'Batch/Lot' | 'Bin/Location'

interface SelectedItem {
  id: string
  code: string
  name: string
  qty: number           // label copies
  entityType: EntityType
  warehouseId?: string
  batchNumber?: string
  expiryDate?: string
}

const FORMAT_OPTIONS: { value: BarcodeFormat; label: string }[] = [
  { value: 'CODE128', label: 'Code 128 (Universal)' },
  { value: 'CODE39',  label: 'Code 39 (Alphanumeric)' },
  { value: 'EAN13',   label: 'EAN-13 (Retail)' },
  { value: 'GS1-128', label: 'GS1-128 (Supply Chain)' },
  { value: 'QR',      label: 'QR Code' },
]

export const GenerateLabelsTab: React.FC = () => {
  const [entityType,      setEntityType]      = useState<EntityType>('SKU')
  const [format,          setFormat]          = useState<BarcodeFormat>('CODE128')
  const [selectedTemplate, setSelectedTemplate] = useState(mockLabelTemplates.find(t => t.isDefault)?.id || mockLabelTemplates[0]?.id)
  const [search,          setSearch]          = useState('')
  const [selectedItems,   setSelectedItems]   = useState<SelectedItem[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  const template = mockLabelTemplates.find(t => t.id === selectedTemplate) || mockLabelTemplates[0]

  // ── Search pool by entity type
  const searchPool = useMemo(() => {
    if (entityType === 'SKU') {
      return mockSKUs.map(s => ({
        id: s.id,
        code: s.skuCode,
        name: s.name,
        warehouseId: s.warehouseId,
        batchNumber: undefined,
        expiryDate: s.expiryDate,
      }))
    }
    if (entityType === 'Batch/Lot') {
      return mockBatches.map(b => ({
        id: b.id,
        code: b.code,
        name: b.name,
        warehouseId: undefined,
        batchNumber: b.code,
        expiryDate: b.expiry,
      }))
    }
    // Bin/Location
    return mockBins.map(b => ({
      id: b.id,
      code: b.code,
      name: b.name,
      warehouseId: b.warehouseId,
      batchNumber: undefined,
      expiryDate: undefined,
    }))
  }, [entityType])

  const filteredPool = useMemo(() => {
    if (!search.trim()) return searchPool.slice(0, 8)
    const q = search.toLowerCase()
    return searchPool.filter(
      i => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [search, searchPool])

  const addItem = (item: typeof filteredPool[0]) => {
    if (selectedItems.find(s => s.id === item.id)) return
    setSelectedItems(prev => [...prev, {
      id: item.id,
      code: item.code,
      name: item.name,
      qty: 1,
      entityType,
      warehouseId: item.warehouseId,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
    }])
    setSearch('')
  }

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(i =>
      i.id === id ? { ...i, qty: Math.max(1, Math.min(20, i.qty + delta)) } : i
    ))
  }

  const handlePrint = () => {
    window.print()
  }

  // Expand items by qty for print sheet
  const printItems = selectedItems.flatMap(item =>
    Array.from({ length: item.qty }, (_, qi) => ({ ...item, _copy: qi + 1 }))
  )

  const getWarehouseName = (id?: string) =>
    id ? (mockWarehouses.find(w => w.id === id)?.name || id) : undefined

  return (
    <div className={styles.container}>
      <div className={styles.configPanel}>
        {/* ── Entity type + format ──────────────────────────────────────── */}
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Entity Type</label>
            <div className={styles.entityPills}>
              {(['SKU', 'Batch/Lot', 'Bin/Location'] as EntityType[]).map(e => (
                <button
                  key={e}
                  onClick={() => { setEntityType(e); setSearch(''); setSelectedItems([]) }}
                  className={`${styles.entityPill} ${entityType === e ? styles.entityPillActive : ''}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Barcode Format</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={format}
                onChange={e => setFormat(e.target.value as BarcodeFormat)}
              >
                {FORMAT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Label Template</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
              >
                {mockLabelTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.sizeLabel})</option>
                ))}
              </select>
              <ChevronDown size={13} className={styles.selectIcon} />
            </div>
          </div>
        </div>

        {/* ── Search picker ─────────────────────────────────────────────── */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Add {entityType}s</label>
          <div className={styles.pickerWrapper}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder={`Search ${entityType}s by name or code…`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {(search.trim() || filteredPool.length > 0) && (
              <div className={styles.dropdown}>
                {filteredPool.length === 0 ? (
                  <div className={styles.dropdownEmpty}>No results found</div>
                ) : filteredPool.map(item => (
                  <button
                    key={item.id}
                    className={`${styles.dropdownItem} ${selectedItems.find(s => s.id === item.id) ? styles.dropdownItemSelected : ''}`}
                    onClick={() => addItem(item)}
                    disabled={!!selectedItems.find(s => s.id === item.id)}
                  >
                    <code className={styles.itemCode}>{item.code}</code>
                    <span className={styles.itemName}>{item.name}</span>
                    {selectedItems.find(s => s.id === item.id) && (
                      <span className={styles.addedBadge}>Added</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Selected items list ───────────────────────────────────────── */}
        {selectedItems.length > 0 && (
          <div className={styles.selectedList}>
            <div className={styles.selectedListHeader}>
              <span className={styles.selectedListTitle}>
                Selected ({selectedItems.length}) — {printItems.length} label{printItems.length !== 1 ? 's' : ''} total
              </span>
            </div>
            {selectedItems.map(item => (
              <div key={item.id} className={styles.selectedItem}>
                <div className={styles.selectedItemInfo}>
                  <code className={styles.itemCode}>{item.code}</code>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
                <div className={styles.qtyControl}>
                  <button onClick={() => updateQty(item.id, -1)} className={styles.qtyBtn}>
                    <Minus size={11} />
                  </button>
                  <span className={styles.qtyValue}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, +1)} className={styles.qtyBtn}>
                    <Plus size={11} />
                  </button>
                  <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItems.length === 0 && (
          <div className={styles.emptyHint}>
            <Info size={15} />
            <span>Select one or more {entityType}s above to generate labels. Each item can have multiple copies.</span>
          </div>
        )}
      </div>

      {/* ── Print preview panel ───────────────────────────────────────────── */}
      <div className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <div className={styles.previewHeaderLeft}>
            <span className={styles.previewTitle}>Print Preview</span>
            <span className={styles.previewMeta}>
              {template?.name} · {template?.sizeLabel} · {format}
            </span>
          </div>
          <button
            className={styles.btnPrint}
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
          >
            <Printer size={15} />
            Print Labels
          </button>
        </div>

        <div className={styles.previewSurface} ref={printRef} id="label-print-area">
          {printItems.length === 0 ? (
            <div className={styles.previewEmpty}>
              <Printer size={32} />
              <p>Add items to see your label sheet preview</p>
            </div>
          ) : (
            <div
              className={styles.labelSheet}
              style={{
                gridTemplateColumns: `repeat(${template?.widthIn && template.widthIn >= 4 ? 2 : 3}, 1fr)`,
              }}
            >
              {printItems.map((item, idx) => (
                <div key={`${item.id}-${item._copy}-${idx}`} className={styles.labelWrapper}>
                  <BarcodeLabelPreview
                    value={item.code}
                    format={format}
                    fields={{
                      skuCode: item.code,
                      productName: item.name,
                      batchNumber: item.batchNumber,
                      expiryDate: item.expiryDate,
                      warehouseName: getWarehouseName(item.warehouseId),
                      binLocation: item.entityType === 'Bin/Location' ? item.name : undefined,
                    }}
                    visibleFields={template?.fields || []}
                    widthIn={template?.widthIn || 4}
                    heightIn={template?.heightIn || 2}
                    size={template?.widthIn <= 2 ? 'sm' : template?.widthIn >= 4 && template?.heightIn >= 6 ? 'lg' : 'md'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── @media print styles injected into head ── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #label-print-area { display: block !important; }
          #label-print-area .${styles.previewHeader ?? 'previewHeader'} { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default GenerateLabelsTab
