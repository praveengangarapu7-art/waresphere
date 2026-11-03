import { mockColdStorageZones, mockDeviationAlerts, mockMaintenanceItems } from '../mock-data/coldStorageReadings'
import { ColdStorageZone, DeviationAlert, MaintenanceItem } from '../types/coldStorage'

let inMemoryZones = [...mockColdStorageZones]
let inMemoryAlerts = [...mockDeviationAlerts]
let inMemoryMaint = [...mockMaintenanceItems]

export const coldStorageService = {
  async getColdStorageZones(): Promise<ColdStorageZone[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryZones), 300))
  },

  async getReadings(): Promise<any[]> {
    return new Promise(resolve => {
      resolve(inMemoryZones.map(z => ({
        ...z,
        currentTemperature: z.currentReading.temp,
        humidity: z.currentReading.humidity
      })))
    })
  },

  async getDeviationAlerts(): Promise<DeviationAlert[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryAlerts), 200))
  },

  async getMaintenanceItems(): Promise<MaintenanceItem[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryMaint), 250))
  },

  async createMaintenanceItem(item: Omit<MaintenanceItem, 'id' | 'status'>): Promise<MaintenanceItem> {
    return new Promise(resolve => {
      setTimeout(() => {
        const isOverdue = new Date(item.nextDueDate).getTime() < new Date().getTime()
        const isDueSoon = !isOverdue && (new Date(item.nextDueDate).getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000)
        
        const created: MaintenanceItem = {
          ...item,
          id: `maint-gen-${Date.now()}`,
          status: isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'On Schedule'
        }
        inMemoryMaint = [created, ...inMemoryMaint]
        resolve(created)
      }, 300)
    })
  },

  async reconnectSensor(zoneId: string, sensorId: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryZones = inMemoryZones.map(zone => {
          if (zone.id === zoneId) {
            return {
              ...zone,
              sensors: zone.sensors.map(s => s.id === sensorId ? { ...s, connectivity: 'Online' } : s)
            }
          }
          return zone
        })
        resolve()
      }, 300)
    })
  },

  async replaceBattery(zoneId: string, sensorId: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryZones = inMemoryZones.map(zone => {
          if (zone.id === zoneId) {
            return {
              ...zone,
              sensors: zone.sensors.map(s => s.id === sensorId ? { ...s, batteryPercent: 100 } : s)
            }
          }
          return zone
        })
        resolve()
      }, 300)
    })
  }
}
export default coldStorageService
