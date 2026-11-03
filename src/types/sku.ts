export interface SkuLocation {
  id: string
  warehouseId: string
  zone: string
  bin: string
  batchNumber: string
  quantity: number
}

export interface SkuBatch {
  batchNumber: string
  lotNumber?: string
  serialNumber?: string
  source: string
  receivedDate: string
  qualityStatus: 'Accepted' | 'Held' | 'Rejected'
  quantityRemaining: number
  expiryDate?: string
}

export interface SkuMovement {
  id: string
  type: 'Receipt/GRN' | 'Putaway' | 'Pick' | 'Bin Transfer' | 'Inter-warehouse Transfer' | 'Adjustment' | 'Return' | 'Dispatch'
  timestamp: string
  delta: number
  before: number
  after: number
  user: string
  reason?: string
}

export interface SkuValuationHistory {
  month: string
  cost: number
}

export interface SKU {
  id: string
  skuCode: string
  name: string
  category: 'Pharma' | 'Food & FMCG' | 'Chemicals' | 'Agri-inputs' | 'Auto Components' | 'General'
  warehouseId: string
  zone: string
  bin: string
  batchNumber: string
  lotNumber?: string
  serialNumber?: string
  quantity: number
  unit: 'units' | 'kg' | 'MT' | 'litres'
  abcClass: 'A' | 'B' | 'C'
  expiryDate?: string
  valuationMethod: 'FIFO' | 'LIFO' | 'Weighted Average' | 'Standard Cost'
  unitCost: number
  totalValue: number
  reorderPoint: number
  safetyStock: number
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon' | 'Expired' | 'Dead Stock'
  lastMovementDate: string
  locations?: SkuLocation[]
  batches?: SkuBatch[]
  movements?: SkuMovement[]
  valuationHistory?: SkuValuationHistory[]
}

export default SKU
