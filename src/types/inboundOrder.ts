export interface InboundLineItem {
  skuId: string
  expectedQty: number
  receivedQty?: number
  qualityStatus?: 'Accepted' | 'Rejected' | 'Hold'
  rejectReason?: string
  putawayBin?: string
  photoCaptured?: boolean
}

export interface InboundOrderGateIn {
  vehicleNumber: string
  driverName: string
  grossWeight: number
  tareWeight: number
  timestamp: string
}

export interface InboundOrder {
  id: string
  asnNumber?: string
  grnNumber?: string
  supplierName: string
  poReference?: string
  warehouseId: string
  source: 'Supplier Delivery' | 'Inter-warehouse Transfer' | 'Customer Return'
  expectedDate: string
  arrivalDate?: string
  status: 'Pending ASN' | 'Arrived / Gate-In' | 'Quality Inspection' | 'Putaway Pending' | 'Completed' | 'On Hold'
  crossDock: boolean
  lineItems: InboundLineItem[]
  gateIn?: InboundOrderGateIn
}
