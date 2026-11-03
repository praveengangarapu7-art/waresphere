import { OutboundOrder } from '../types/outboundOrder'

export const mockOutboundOrders: OutboundOrder[] = [
  {
    id: 'out-1',
    orderNumber: 'SO-2026-0001',
    orderType: 'Sales Order',
    customerName: 'Apollo Hospitals Ltd.',
    consigneeAddress: 'Jubilee Hills, Road No. 72, Hyderabad',
    consigneeState: 'Telangana',
    consigneeGstin: '36AAAAC8821B1Z2',
    warehouseId: 'wh-hyd', // Intra-state (Telangana to Telangana)
    orderDate: '2026-07-11',
    requiredDispatchDate: '2026-07-12',
    invoiceValue: 85000, // > 50000 (Triggers e-Way Bill)
    status: 'Pending',
    lineItems: [
      { skuId: '1', orderedQty: 500 },
      { skuId: '2', orderedQty: 200 }
    ]
  },
  {
    id: 'out-2',
    orderNumber: 'SO-2026-0002',
    orderType: 'Sales Order',
    customerName: 'Reliance Retail Depot',
    consigneeAddress: 'Kopar Khairane, Navi Mumbai',
    consigneeState: 'Maharashtra',
    consigneeGstin: '27AAAAC8821B1Z1',
    warehouseId: 'wh-mum', // Intra-state (Bhiwandi to Navi Mumbai)
    orderDate: '2026-07-12',
    requiredDispatchDate: '2026-07-12',
    invoiceValue: 120000, // > 50000
    status: 'Picking',
    pickingStrategy: 'Wave',
    lineItems: [
      { skuId: '6', orderedQty: 1000, pickedQty: 600, pickBin: 'Zone B · Rack 01 · Bin B-01-05' },
      { skuId: '7', orderedQty: 400, pickedQty: 0 }
    ]
  },
  {
    id: 'out-3',
    orderNumber: 'MR-2026-0003',
    orderType: 'Material Request',
    customerName: 'Delhi Warehouse Hub',
    consigneeAddress: 'Manesar Industrial Sector 8',
    consigneeState: 'Haryana',
    warehouseId: 'wh-mum', // Inter-state (Maharashtra to Haryana)
    orderDate: '2026-07-11',
    requiredDispatchDate: '2026-07-13',
    invoiceValue: 35000, // < 50000
    status: 'Allocated',
    lineItems: [
      { skuId: '11', orderedQty: 2000 }
    ]
  },
  {
    id: 'out-4',
    orderNumber: 'SO-2026-0004',
    orderType: 'Sales Order',
    customerName: 'Max Healthcare Depot',
    consigneeAddress: 'Saket District Centre, New Delhi',
    consigneeState: 'Delhi',
    consigneeGstin: '07AAAAC8821B1Z0',
    warehouseId: 'wh-del', // Intra-state (Gurugram to Delhi is actually inter-state Haryana to Delhi)
    orderDate: '2026-07-10',
    requiredDispatchDate: '2026-07-12',
    invoiceValue: 45000,
    status: 'Packed',
    pickingStrategy: 'Single Order',
    lineItems: [
      { skuId: '1', orderedQty: 200, pickedQty: 200, packedQty: 200, pickBin: 'Zone A · Rack 01 · Bin A-01-05' }
    ]
  },
  {
    id: 'out-5',
    orderNumber: 'SO-2026-0005',
    orderType: 'Sales Order',
    customerName: 'MedPlus Pharma Distributor',
    consigneeAddress: 'Kukatpally Industrial Area, Hyderabad',
    consigneeState: 'Telangana',
    consigneeGstin: '36AAAAC8821B1Z2',
    warehouseId: 'wh-blr', // Inter-state (Karnataka to Telangana)
    orderDate: '2026-07-12',
    requiredDispatchDate: '2026-07-12',
    invoiceValue: 145000, // > 50000
    status: 'Delivered',
    arrivalDate: '2026-07-12',
    lineItems: [
      { skuId: '1', orderedQty: 800, pickedQty: 800, packedQty: 800, pickBin: 'Zone Bio-Vault · Bin 05-2' }
    ],
    vehicleNumber: 'KA-03-MM-4491',
    logisticsPartner: 'Safexpress',
    ewayBillNumber: 'EWB-2026-118844',
    dispatchedAt: '2026-07-12 11:00',
    deliveredAt: '2026-07-12 16:30',
    podCaptured: true,
    podSignature: 'Verified (Mehra)',
    podGeolocation: '17.4855° N, 78.3885° E — Kukatpally, Hyd'
  },
  {
    id: 'out-6',
    orderNumber: 'SO-2026-0006',
    orderType: 'Sales Order',
    customerName: 'JioMart FMCG Fulfilment',
    consigneeAddress: 'Prestige Tech Park, Outer Ring Road, Bengaluru',
    consigneeState: 'Karnataka',
    consigneeGstin: '29AAAAC8821B1Z8',
    warehouseId: 'wh-blr', // Intra-state (Karnataka to Karnataka)
    orderDate: '2026-07-11',
    requiredDispatchDate: '2026-07-13',
    invoiceValue: 62000, // > 50000
    status: 'Dispatched',
    lineItems: [
      { skuId: '6', orderedQty: 600, pickedQty: 600, packedQty: 600, pickBin: 'Zone A · Bin 02-1' }
    ],
    vehicleNumber: 'KA-05-JK-1002',
    logisticsPartner: 'BlueDart',
    ewayBillNumber: 'EWB-2026-990022',
    dispatchedAt: '2026-07-12 09:30'
  }
]
export default mockOutboundOrders
