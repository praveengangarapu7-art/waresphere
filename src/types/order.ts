export interface Order {
  id: string
  orderNumber: string
  type: 'Inbound' | 'Outbound'
  status: string
  createdDate: string
  itemsCount: number
  assignedWarehouseId: string
}
