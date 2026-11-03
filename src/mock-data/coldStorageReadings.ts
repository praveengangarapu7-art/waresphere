import { ColdStorageZone, DeviationAlert, MaintenanceItem } from '../types/coldStorage'

// 24h history mock generator helper
const generate24hHistory = (baseTemp: number, deviationOffset: number = 0) => {
  const history = []
  const now = new Date()
  for (let i = 24; i >= 0; i -= 2) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hour = time.getHours()
    
    // Add deviation spike around 4 hours ago for warning zones
    const spike = i === 4 ? deviationOffset : 0

    history.push({
      timestamp: `${String(hour).padStart(2, '0')}:00`,
      temp: parseFloat((baseTemp + Math.sin(i) * 0.4 + spike).toFixed(1)),
      humidity: Math.round(60 + Math.cos(i) * 3)
    })
  }
  return history
}

export const mockColdStorageZones: ColdStorageZone[] = [
  {
    id: 'cs-mum-1',
    zoneId: 'z-wh-mum-3',
    zoneName: 'Chamber Room C-04',
    warehouseId: 'wh-mum',
    warehouseName: 'Mumbai Logistics Hub',
    targetRange: { min: 2, max: 8, unit: 'C' },
    skuClasses: [
      { name: 'Insulin Chilled', range: { min: 2, max: 8 } },
      { name: 'Vaccines Bio-Cold', range: { min: 2, max: 8 } }
    ],
    currentReading: { temp: 4.2, humidity: 62, timestamp: '2 mins ago' },
    status: 'In Range',
    history24h: generate24hHistory(4.0),
    sensors: [
      { id: 'SN-MUM-C04-1', model: 'Zebra TempTrack Pro', batteryPercent: 88, connectivity: 'Online', lastReading: '2 mins ago' },
      { id: 'SN-MUM-C04-2', model: 'Zebra TempTrack Pro', batteryPercent: 92, connectivity: 'Online', lastReading: '2 mins ago' }
    ]
  },
  {
    id: 'cs-del-1',
    zoneId: 'z-wh-del-3',
    zoneName: 'Deep Freeze Chamber F-01',
    warehouseId: 'wh-del',
    warehouseName: 'NCR Industrial Center',
    targetRange: { min: -25, max: -15, unit: 'C' },
    skuClasses: [
      { name: 'Frozen Biologics', range: { min: -25, max: -15 } }
    ],
    currentReading: { temp: -13.5, humidity: 55, timestamp: '5 mins ago' },
    status: 'Critical', // Target is -25 to -15, current is -13.5 (too warm)
    history24h: generate24hHistory(-18.0, 5.5), // spike +5.5 deg warm
    sensors: [
      { id: 'SN-DEL-F01-1', model: 'Zebra TempTrack Pro', batteryPercent: 12, connectivity: 'Online', lastReading: '5 mins ago' }, // Low Battery!
      { id: 'SN-DEL-F01-2', model: 'Zebra TempTrack Pro', batteryPercent: 85, connectivity: 'Offline', lastReading: '45 mins ago' } // Offline!
    ]
  },
  {
    id: 'cs-blr-1',
    zoneId: 'z-wh-blr-3',
    zoneName: 'Chilled Pharma Vault C-01',
    warehouseId: 'wh-blr',
    warehouseName: 'Bengaluru Tech Storage',
    targetRange: { min: 2, max: 8, unit: 'C' },
    skuClasses: [
      { name: 'Sensitive Bio-reagents', range: { min: 2, max: 8 } }
    ],
    currentReading: { temp: 7.8, humidity: 64, timestamp: '1 min ago' },
    status: 'Warning', // Approaching upper limit of 8
    history24h: generate24hHistory(6.8, 1.1),
    sensors: [
      { id: 'SN-BLR-C01-1', model: 'Zebra TempTrack Pro', batteryPercent: 74, connectivity: 'Online', lastReading: '1 min ago' }
    ]
  },
  {
    id: 'cs-hyd-1',
    zoneId: 'z-wh-hyd-3',
    zoneName: 'Main Cold Storage C-02',
    warehouseId: 'wh-hyd',
    warehouseName: 'Hyderabad Pharma Depo',
    targetRange: { min: 2, max: 8, unit: 'C' },
    skuClasses: [
      { name: 'Antibiotics APIs', range: { min: 2, max: 8 } }
    ],
    currentReading: { temp: 4.8, humidity: 61, timestamp: '3 mins ago' },
    status: 'In Range',
    history24h: generate24hHistory(4.5),
    sensors: [
      { id: 'SN-HYD-C02-1', model: 'Zebra TempTrack Pro', batteryPercent: 91, connectivity: 'Online', lastReading: '3 mins ago' }
    ]
  }
]

export const mockDeviationAlerts: DeviationAlert[] = [
  {
    id: 'al-cs-1',
    zoneId: 'cs-del-1',
    zoneName: 'Deep Freeze Chamber F-01',
    warehouseId: 'wh-del',
    warehouseName: 'NCR Industrial Center',
    startedAt: '2026-07-12 14:30',
    resolvedAt: undefined,
    peakDeviation: 6.5, // 6.5 degrees above target
    escalationTier: 'Manager', // Duration exceeded 45 mins
    channelsNotified: ['SMS', 'Email', 'WhatsApp', 'In-App'],
    status: 'Ongoing'
  },
  {
    id: 'al-cs-2',
    zoneId: 'cs-blr-1',
    zoneName: 'Chilled Pharma Vault C-01',
    warehouseId: 'wh-blr',
    warehouseName: 'Bengaluru Tech Storage',
    startedAt: '2026-07-12 10:15',
    resolvedAt: '2026-07-12 10:45',
    peakDeviation: 1.2,
    escalationTier: 'Supervisor',
    channelsNotified: ['SMS', 'In-App'],
    status: 'Resolved'
  },
  {
    id: 'al-cs-3',
    zoneId: 'cs-mum-1',
    zoneName: 'Chamber Room C-04',
    warehouseId: 'wh-mum',
    warehouseName: 'Mumbai Logistics Hub',
    startedAt: '2026-07-10 09:00',
    resolvedAt: '2026-07-10 09:12',
    peakDeviation: 0.8,
    escalationTier: 'Initial',
    channelsNotified: ['In-App'],
    status: 'Resolved'
  }
]

export const mockMaintenanceItems: MaintenanceItem[] = [
  {
    id: 'maint-1',
    equipmentName: 'Primary Carrier Chiller Unit #4',
    type: 'Chiller',
    warehouseId: 'wh-mum',
    zoneId: 'cs-mum-1',
    lastServicedDate: '2026-04-10',
    nextDueDate: '2026-07-10', // Overdue!
    status: 'Overdue',
    vendor: 'Carrier Thermo-King Corp.'
  },
  {
    id: 'maint-2',
    equipmentName: 'Backup Generator Array G-03',
    type: 'Generator',
    warehouseId: 'wh-del',
    lastServicedDate: '2026-05-15',
    nextDueDate: '2026-08-15',
    status: 'On Schedule',
    vendor: 'Cummins India Ltd.'
  },
  {
    id: 'maint-3',
    equipmentName: 'IoT Temperature Sensor Array calibration',
    type: 'Sensor Array',
    warehouseId: 'wh-blr',
    zoneId: 'cs-blr-1',
    lastServicedDate: '2026-06-20',
    nextDueDate: '2026-07-20',
    status: 'Due Soon',
    vendor: 'Wipro IoT Calibration Labs'
  }
]

export const mockColdStorageReadings = mockColdStorageZones.map(z => ({
  ...z,
  currentTemperature: z.currentReading.temp,
  humidity: z.currentReading.humidity
}))
export default mockColdStorageZones

