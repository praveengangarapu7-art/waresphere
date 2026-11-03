export interface RfidTag {
  id: string
  tagId: string             // EPC / RFID tag identifier
  associatedSku: string     // SKU name or Pallet ID
  warehouseId: string
  lastReadLocation: string  // Zone + rack
  lastReadTime: string      // ISO datetime
  status: 'Active' | 'Inactive' | 'Missing'
}

export const mockRfidTags: RfidTag[] = [
  {
    id: 'rfid-1',
    tagId: 'EPC-3034099EE0001A2B',
    associatedSku: 'Amoxicillin 500mg Capsules — Pallet P-001',
    warehouseId: 'wh-mum',
    lastReadLocation: 'Zone A · Rack R2 · Shelf S1',
    lastReadTime: '2026-07-13T15:32:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-2',
    tagId: 'EPC-3034099EE0002C3D',
    associatedSku: 'Basmati Rice 25kg — Pallet P-002',
    warehouseId: 'wh-del',
    lastReadLocation: 'Zone B · Rack R1 · Shelf S3',
    lastReadTime: '2026-07-13T14:18:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-3',
    tagId: 'EPC-3034099EE0003E4F',
    associatedSku: 'Refined Sunflower Oil 15L — Pallet P-003',
    warehouseId: 'wh-del',
    lastReadLocation: 'Zone B · Rack R3 · Shelf S2',
    lastReadTime: '2026-07-13T13:05:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-4',
    tagId: 'EPC-3034099EE000456A',
    associatedSku: 'Paracetamol Syrup 60ml — Pallet P-004',
    warehouseId: 'wh-mum',
    lastReadLocation: 'Cold Chamber C-04 · Rack R1 · Shelf S1',
    lastReadTime: '2026-07-13T16:01:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-5',
    tagId: 'EPC-3034099EE000567B',
    associatedSku: 'NPK 19:19:19 Fertilizer — Pallet P-005',
    warehouseId: 'wh-hyd',
    lastReadLocation: 'Zone A · Rack R1 · Shelf S2',
    lastReadTime: '2026-07-12T22:45:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-6',
    tagId: 'EPC-3034099EE000678C',
    associatedSku: 'Maruti Alto Brake Pad Set — SKU-021',
    warehouseId: 'wh-pne',
    lastReadLocation: 'Dry Area B · Rack R2 · Shelf S3',
    lastReadTime: '2026-07-13T10:20:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-7',
    tagId: 'EPC-3034099EE000789D',
    associatedSku: 'Isopropyl Alcohol (Industrial) — Pallet P-007',
    warehouseId: 'wh-mum',
    lastReadLocation: 'Hazardous Vault D-01 · Rack R1 · Shelf S1',
    lastReadTime: '2026-07-11T18:30:00Z',
    status: 'Inactive',
  },
  {
    id: 'rfid-8',
    tagId: 'EPC-3034099EE000890E',
    associatedSku: 'Atorvastatin 10mg Tablets — Pallet P-008',
    warehouseId: 'wh-blr',
    lastReadLocation: 'Zone A · Rack R3 · Shelf S1',
    lastReadTime: '2026-07-13T08:12:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-9',
    tagId: 'EPC-3034099EE000901F',
    associatedSku: 'Honda City Spark Plug Set — SKU-044',
    warehouseId: 'wh-pne',
    lastReadLocation: 'Unknown — last gate read at Dock 3',
    lastReadTime: '2026-07-10T11:55:00Z',
    status: 'Missing',
  },
  {
    id: 'rfid-10',
    tagId: 'EPC-3034099EE001012G',
    associatedSku: 'N95 Protective Masks — Pallet P-010',
    warehouseId: 'wh-chn',
    lastReadLocation: 'Zone A · Rack R1 · Shelf S2',
    lastReadTime: '2026-07-13T15:58:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-11',
    tagId: 'EPC-3034099EE001123H',
    associatedSku: 'Wooden Pallet (Euro Standard) — Pallet P-011',
    warehouseId: 'wh-ahm',
    lastReadLocation: 'Sorting & Packing D-02 · Rack R2',
    lastReadTime: '2026-07-13T14:44:00Z',
    status: 'Active',
  },
  {
    id: 'rfid-12',
    tagId: 'EPC-3034099EE001234I',
    associatedSku: 'Caustic Soda Flakes 50kg — Pallet P-012',
    warehouseId: 'wh-del',
    lastReadLocation: 'Hazardous Vault D-01 · Rack R2 · Shelf S1',
    lastReadTime: '2026-07-13T09:33:00Z',
    status: 'Active',
  },
]

export default mockRfidTags
