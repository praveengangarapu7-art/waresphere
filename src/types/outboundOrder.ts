export interface OutboundLineItem {
  skuId: string
  orderedQty: number
  pickedQty?: number
  packedQty?: number
  pickBin?: string
}

export interface OutboundOrder {
  id: string
  orderNumber: string
  orderType: 'Sales Order' | 'Material Request'
  customerName: string
  consigneeAddress: string
  consigneeState: string
  consigneeGstin?: string
  warehouseId: string
  orderDate: string
  arrivalDate?: string
  requiredDispatchDate: string
  pickingStrategy?: 'Single Order' | 'Wave' | 'Batch'
  invoiceValue: number
  status:
    | 'Pending' | 'Allocated' | 'Picking' | 'Picked' | 'Packed'
    | 'Loaded' | 'Dispatched' | 'In Transit' | 'Delivered'
  lineItems: OutboundLineItem[]
  vehicleNumber?: string
  logisticsPartner?: string
  ewayBillNumber?: string
  dispatchedAt?: string
  deliveredAt?: string
  podCaptured?: boolean
  podSignature?: string
  podPhotoCaptured?: boolean
  podGeolocation?: string
}
