import { Order } from '../types/order'

export const mockOrders: Order[] = [
  { id: 'ord-101', orderNumber: 'ORD-IN-8899', type: 'Inbound', status: 'Receiving', createdDate: '2026-07-09T10:00:00Z', itemsCount: 4, assignedWarehouseId: 'wh-mum' },
  { id: 'ord-102', orderNumber: 'ORD-OUT-9911', type: 'Outbound', status: 'Picking', createdDate: '2026-07-10T14:30:00Z', itemsCount: 2, assignedWarehouseId: 'wh-del' },
  { id: 'ord-103', orderNumber: 'ORD-IN-8900', type: 'Inbound', status: 'Pending', createdDate: '2026-07-10T16:00:00Z', itemsCount: 5, assignedWarehouseId: 'wh-blr' }
]
