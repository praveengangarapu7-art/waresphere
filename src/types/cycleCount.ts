export interface CycleCountItem {
  skuId: string
  skuName?: string   // resolved display name (optional — page resolves from SKU data)
  bin: string
  systemQty: number
  countedQty?: number
  varianceQty?: number
  variancePercent?: number
}

export interface CycleCount {
  id: string
  countNumber: string
  strategy: 'ABC-Based' | 'Zone-Based' | 'Random Sampling' | 'Event-Triggered' | 'Full Physical Inventory'
  scopeLabel: string
  warehouseId: string
  scheduledDate: string
  assignedTo: string
  isBlindCount: boolean
  status: 'Scheduled' | 'In Progress' | 'Pending Approval' | 'Completed' | 'Rejected'
  items: CycleCountItem[]
  totalVarianceValue?: number
  approvalTier?: 'Auto' | 'Supervisor' | 'Manager'
  approvedBy?: string
  completedAt?: string
  rejectReason?: string
}

export default CycleCount
