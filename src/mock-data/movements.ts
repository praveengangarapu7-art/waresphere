import { StockMovement } from '../types/movement'

export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    movementNumber: 'TR-2026-0001',
    type: 'Inter-Warehouse Transfer',
    status: 'Pending Approval',
    fromWarehouseId: 'wh-mum',
    toWarehouseId: 'wh-blr',
    lineItems: [
      { skuId: '1', quantity: 300, batchNumber: 'BAT-PHR-001' }
    ],
    requestedBy: 'Ranjit Singh',
    requestedAt: '2026-07-12 09:00'
  },
  {
    id: 'mov-2',
    movementNumber: 'BB-2026-0002',
    type: 'Bin-to-Bin Move',
    status: 'Completed',
    fromWarehouseId: 'wh-mum',
    fromBin: 'Zone B · Bin B-01-05',
    toBin: 'Zone B · Bin B-01-12',
    lineItems: [
      { skuId: '6', quantity: 200, batchNumber: 'BAT-FMCG-902' }
    ],
    reasonCode: 'Re-slotting',
    requestedBy: 'Rohan Sharma',
    requestedAt: '2026-07-12 10:15'
  },
  {
    id: 'mov-3',
    movementNumber: 'AD-2026-0003',
    type: 'Stock Adjustment',
    status: 'Pending Approval',
    fromWarehouseId: 'wh-del',
    lineItems: [
      { skuId: '2', quantity: -50, batchNumber: 'BAT-PHR-002' }
    ],
    reasonCode: 'Expiry Disposal',
    valueImpact: 8500, // < 10000 (Auto-approve threshold check, but set to Pending Approval to test Supervisor tier)
    requestedBy: 'Amit Patel',
    requestedAt: '2026-07-12 08:30'
  },
  {
    id: 'mov-4',
    movementNumber: 'AD-2026-0004',
    type: 'Stock Adjustment',
    status: 'Pending Approval',
    fromWarehouseId: 'wh-hyd',
    lineItems: [
      { skuId: '11', quantity: -150, batchNumber: 'BAT-CHEM-101' }
    ],
    reasonCode: 'Damage',
    valueImpact: 24500, // 10000 - 50000 (Needs Supervisor approval)
    requestedBy: 'Vikram Reddy',
    requestedAt: '2026-07-11 15:40'
  },
  {
    id: 'mov-5',
    movementNumber: 'AD-2026-0005',
    type: 'Stock Adjustment',
    status: 'Pending Approval',
    fromWarehouseId: 'wh-pne',
    lineItems: [
      { skuId: '21', quantity: -600, batchNumber: 'BAT-AUTO-202' }
    ],
    reasonCode: 'Theft',
    valueImpact: 78000, // > 50000 (Needs Manager approval)
    requestedBy: 'Sachin Patil',
    requestedAt: '2026-07-12 11:20'
  },
  {
    id: 'mov-6',
    movementNumber: 'RT-2026-0006',
    type: 'Customer Return',
    status: 'Requested',
    fromWarehouseId: 'wh-mum',
    lineItems: [
      { skuId: '1', quantity: 20, batchNumber: 'BAT-PHR-001' }
    ],
    counterpartyName: 'Apollo Hospitals Ltd.',
    reasonCode: 'Damaged in Transit',
    valueImpact: 3400,
    requestedBy: 'Ranjit Singh',
    requestedAt: '2026-07-12 09:45'
  },
  {
    id: 'mov-7',
    movementNumber: 'KT-2026-0007',
    type: 'Kit Assembly',
    status: 'Completed',
    fromWarehouseId: 'wh-mum',
    lineItems: [
      { skuId: '1', quantity: -10 },
      { skuId: '2', quantity: -20 },
      { skuId: '6', quantity: 10 } // Assumed Kit Parent SKU ID
    ],
    requestedBy: 'Rohan Sharma',
    requestedAt: '2026-07-12 13:00'
  },
  {
    id: 'mov-8',
    movementNumber: 'MI-2026-0008',
    type: 'Material Issue',
    status: 'Completed',
    fromWarehouseId: 'wh-hyd',
    fromBin: 'Zone B · Bin B-03-05',
    lineItems: [
      { skuId: '11', quantity: 500, batchNumber: 'BAT-CHEM-101' }
    ],
    reasonCode: 'Production Line #3',
    requestedBy: 'Vikram Reddy',
    requestedAt: '2026-07-12 14:15'
  },
  {
    id: 'mov-9',
    movementNumber: 'TR-2026-0009',
    type: 'Inter-Warehouse Transfer',
    status: 'Rejected',
    fromWarehouseId: 'wh-del',
    toWarehouseId: 'wh-mum',
    lineItems: [
      { skuId: '6', quantity: 1500 }
    ],
    requestedBy: 'Amit Patel',
    requestedAt: '2026-07-10 11:00',
    approvedBy: 'Priya Nair', // Acting as rejecting supervisor
    approvedAt: '2026-07-10 14:00',
    reasonCode: 'High volume transfer not allowed during active audits'
  }
]
export default mockStockMovements
