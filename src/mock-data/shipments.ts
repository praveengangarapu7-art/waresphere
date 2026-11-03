export interface Shipment {
  id: string
  shipmentNo: string
  carrierName: string
  driverName: string
  vehicleNo: string
  status: string
  eta: string
}

export const mockShipments: Shipment[] = [
  { id: 'sh-1', shipmentNo: 'SH-MUM-908', carrierName: 'TCI Freight', driverName: 'Rajesh Kumar', vehicleNo: 'MH-04-GP-1234', status: 'In Transit', eta: '2026-07-11T12:00:00Z' },
  { id: 'sh-2', shipmentNo: 'SH-DEL-771', carrierName: 'Delhivery', driverName: 'Sukhdev Singh', vehicleNo: 'DL-01-AA-9988', status: 'Loaded', eta: '2026-07-10T22:00:00Z' }
]
