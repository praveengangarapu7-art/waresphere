export interface ColdStorageSensor {
  id: string
  model: string
  batteryPercent: number
  connectivity: 'Online' | 'Offline'
  lastReading: string
}

export interface ColdStorageZone {
  id: string
  zoneId: string
  zoneName: string
  warehouseId: string
  warehouseName: string
  targetRange: { min: number; max: number; unit: 'C' }
  skuClasses: { name: string; range: { min: number; max: number } }[]
  currentReading: { temp: number; humidity: number; timestamp: string }
  history24h: { timestamp: string; temp: number; humidity: number }[]
  status: 'In Range' | 'Warning' | 'Critical'
  sensors: ColdStorageSensor[]
}

export interface DeviationAlert {
  id: string
  zoneId: string
  zoneName: string
  warehouseId: string
  warehouseName: string
  startedAt: string
  resolvedAt?: string
  peakDeviation: number
  escalationTier: 'Initial' | 'Supervisor' | 'Manager'
  channelsNotified: ('SMS' | 'Email' | 'WhatsApp' | 'In-App')[]
  status: 'Ongoing' | 'Resolved'
}

export interface MaintenanceItem {
  id: string
  equipmentName: string
  type: 'Chiller' | 'Generator' | 'Sensor Array' | 'Cooling Unit'
  warehouseId: string
  zoneId?: string
  lastServicedDate: string
  nextDueDate: string
  status: 'On Schedule' | 'Due Soon' | 'Overdue'
  vendor: string
}
