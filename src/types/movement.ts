export interface StockMovementLineItem {
  skuId: string
  quantity: number
  batchNumber?: string
  fromBin?: string
  toBin?: string
}

export interface StockMovement {
  id: string
  movementNumber: string
  type:
    | 'Inter-Warehouse Transfer'
    | 'Bin-to-Bin Move'
    | 'Stock Adjustment'
    | 'Customer Return'
    | 'Supplier Return'
    | 'Kit Assembly'
    | 'Kit Disassembly'
    | 'Material Issue'
  status: 'Requested' | 'Pending Approval' | 'Approved' | 'Rejected' | 'In Transit' | 'Received' | 'Completed'
  fromWarehouseId?: string
  toWarehouseId?: string
  fromBin?: string
  toBin?: string
  lineItems: StockMovementLineItem[]
  reasonCode?: string
  counterpartyName?: string   // for returns
  valueImpact?: number        // for adjustments/returns, used for approval-tier logic
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
}
