import { InboundOrder } from '../types/inboundOrder'

export const mockInboundOrders: InboundOrder[] = [
  {
    id: 'in-1',
    asnNumber: 'ASN-2026-0001',
    supplierName: 'Aurobindo Pharma Ltd.',
    poReference: 'PO-PHR-8812',
    warehouseId: 'wh-mum',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-12',
    status: 'Arrived / Gate-In',
    crossDock: false,
    lineItems: [
      { skuId: '1', expectedQty: 1000 }, // Amoxicillin
      { skuId: '2', expectedQty: 500 }   // Paracetamol
    ]
  },
  {
    id: 'in-2',
    asnNumber: 'ASN-2026-0002',
    supplierName: 'Britannia FMCG Foods',
    poReference: 'PO-FMCG-9011',
    warehouseId: 'wh-del',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-12',
    status: 'Quality Inspection',
    crossDock: false,
    lineItems: [
      { skuId: '6', expectedQty: 1500, receivedQty: 1500, qualityStatus: 'Accepted' }, // Basmati Rice
      { skuId: '7', expectedQty: 800, receivedQty: 780, qualityStatus: 'Hold', rejectReason: 'Quantity Shortfall' }  // Sunflower Oil
    ],
    gateIn: {
      vehicleNumber: 'MH-43-AG-8812',
      driverName: 'Satish Patil',
      grossWeight: 14200,
      tareWeight: 9200,
      timestamp: '2026-07-12 09:30'
    }
  },
  {
    id: 'in-3',
    asnNumber: 'ASN-2026-0003',
    supplierName: 'Tata Chemicals Sanand',
    poReference: 'PO-CHEM-7741',
    warehouseId: 'wh-mum',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-13',
    status: 'Pending ASN',
    crossDock: false,
    lineItems: [
      { skuId: '11', expectedQty: 4000 } // Sodium Hypochlorite
    ]
  },
  {
    id: 'in-4',
    asnNumber: 'ASN-2026-0004',
    supplierName: 'Chambal Fertilizers Ltd.',
    poReference: 'PO-AGRI-1002',
    warehouseId: 'wh-hyd',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-11',
    status: 'Putaway Pending',
    crossDock: false,
    lineItems: [
      { skuId: '16', expectedQty: 8000, receivedQty: 8000, qualityStatus: 'Accepted', putawayBin: 'Zone A · Bin 12-1' } // NPK
    ],
    gateIn: {
      vehicleNumber: 'TS-09-UB-4421',
      driverName: 'Vikram Yadav',
      grossWeight: 18450,
      tareWeight: 8450,
      timestamp: '2026-07-11 11:20'
    }
  },
  {
    id: 'in-5',
    asnNumber: 'ASN-2026-0005',
    supplierName: 'Mumbai Warehouse Hub',
    poReference: 'TR-MUM-BLR-01',
    warehouseId: 'wh-blr',
    source: 'Inter-warehouse Transfer',
    expectedDate: '2026-07-12',
    status: 'Completed',
    crossDock: false,
    arrivalDate: '2026-07-12',
    lineItems: [
      { skuId: '1', expectedQty: 300, receivedQty: 300, qualityStatus: 'Accepted', putawayBin: 'Zone Bio-Vault · Bin 05-2' }
    ],
    gateIn: {
      vehicleNumber: 'KA-51-MM-0091',
      driverName: 'Naseer Khan',
      grossWeight: 11200,
      tareWeight: 9200,
      timestamp: '2026-07-12 10:15'
    }
  },
  {
    id: 'in-6',
    asnNumber: 'ASN-2026-0006',
    supplierName: 'Cipla Depot Mumbai',
    poReference: 'PO-PHR-8991',
    warehouseId: 'wh-hyd',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-10',
    status: 'On Hold',
    crossDock: false,
    lineItems: [
      { skuId: '2', expectedQty: 2000, receivedQty: 1800, qualityStatus: 'Rejected', rejectReason: 'Temperature Excursion' }
    ],
    gateIn: {
      vehicleNumber: 'AP-15-TU-8891',
      driverName: 'Rajesh Goud',
      grossWeight: 12800,
      tareWeight: 9300,
      timestamp: '2026-07-10 14:00'
    }
  },
  {
    id: 'in-7',
    asnNumber: 'ASN-2026-0007',
    supplierName: 'Maruti Suzuki Parts',
    poReference: 'PO-AUTO-3341',
    warehouseId: 'wh-pne',
    source: 'Supplier Delivery',
    expectedDate: '2026-07-14',
    status: 'Pending ASN',
    crossDock: false,
    lineItems: [
      { skuId: '21', expectedQty: 100 } // Maruti Alto Brake Pad
    ]
  },
  {
    id: 'in-8',
    grnNumber: 'GRN-2026-0008',
    supplierName: 'Walk-in Customer Return (Sun Pharma)',
    poReference: 'RET-SUN-002',
    warehouseId: 'wh-mum',
    source: 'Customer Return',
    expectedDate: '2026-07-12',
    status: 'Arrived / Gate-In',
    crossDock: false,
    lineItems: [
      { skuId: '2', expectedQty: 100 }
    ]
  }
]
export default mockInboundOrders
