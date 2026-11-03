export interface HandheldDevice {
  id: string
  deviceId: string
  assignedTo: string
  model: 'Zebra TC21' | 'Zebra MC3300' | 'Honeywell CT45' | 'Honeywell CK65' | 'Zebra TC72'
  batteryPercent: number
  connectivity: 'Online' | 'Offline'
  lastSync: string        // ISO datetime string
  offlineQueueCount: number
  warehouseId: string
}

export const mockHandheldDevices: HandheldDevice[] = [
  {
    id: 'dev-1',
    deviceId: 'ZBR-TC21-001',
    assignedTo: 'Rohan Sharma',
    model: 'Zebra TC21',
    batteryPercent: 82,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:45:00Z',
    offlineQueueCount: 0,
    warehouseId: 'wh-mum',
  },
  {
    id: 'dev-2',
    deviceId: 'ZBR-TC21-002',
    assignedTo: 'Ranjit Singh',
    model: 'Zebra TC21',
    batteryPercent: 14,           // LOW BATTERY
    connectivity: 'Online',
    lastSync: '2026-07-13T16:40:00Z',
    offlineQueueCount: 3,
    warehouseId: 'wh-mum',
  },
  {
    id: 'dev-3',
    deviceId: 'HNW-CT45-001',
    assignedTo: 'Amit Patel',
    model: 'Honeywell CT45',
    batteryPercent: 55,
    connectivity: 'Offline',       // OFFLINE
    lastSync: '2026-07-13T12:15:00Z',
    offlineQueueCount: 17,
    warehouseId: 'wh-del',
  },
  {
    id: 'dev-4',
    deviceId: 'ZBR-MC3300-001',
    assignedTo: 'Vikram Reddy',
    model: 'Zebra MC3300',
    batteryPercent: 91,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:50:00Z',
    offlineQueueCount: 0,
    warehouseId: 'wh-hyd',
  },
  {
    id: 'dev-5',
    deviceId: 'ZBR-TC72-001',
    assignedTo: 'Priya Nair',
    model: 'Zebra TC72',
    batteryPercent: 67,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:30:00Z',
    offlineQueueCount: 0,
    warehouseId: 'wh-blr',
  },
  {
    id: 'dev-6',
    deviceId: 'HNW-CT45-002',
    assignedTo: 'Sachin Patil',
    model: 'Honeywell CT45',
    batteryPercent: 8,             // CRITICAL BATTERY
    connectivity: 'Online',
    lastSync: '2026-07-13T16:35:00Z',
    offlineQueueCount: 2,
    warehouseId: 'wh-pne',
  },
  {
    id: 'dev-7',
    deviceId: 'ZBR-MC3300-002',
    assignedTo: 'Karthik Raja',
    model: 'Zebra MC3300',
    batteryPercent: 43,
    connectivity: 'Offline',       // OFFLINE
    lastSync: '2026-07-13T09:05:00Z',
    offlineQueueCount: 42,
    warehouseId: 'wh-chn',
  },
  {
    id: 'dev-8',
    deviceId: 'HNW-CK65-001',
    assignedTo: 'Harish Rao',
    model: 'Honeywell CK65',
    batteryPercent: 77,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:48:00Z',
    offlineQueueCount: 0,
    warehouseId: 'wh-mum',
  },
  {
    id: 'dev-9',
    deviceId: 'ZBR-TC21-003',
    assignedTo: 'Vijay Patel',
    model: 'Zebra TC21',
    batteryPercent: 62,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:20:00Z',
    offlineQueueCount: 5,
    warehouseId: 'wh-ahm',
  },
  {
    id: 'dev-10',
    deviceId: 'ZBR-TC72-002',
    assignedTo: 'Meera Krishnan',
    model: 'Zebra TC72',
    batteryPercent: 88,
    connectivity: 'Online',
    lastSync: '2026-07-13T16:52:00Z',
    offlineQueueCount: 0,
    warehouseId: 'wh-blr',
  },
]

export default mockHandheldDevices
