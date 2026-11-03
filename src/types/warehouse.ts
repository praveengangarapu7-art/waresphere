export interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  location: string
  gstin: string
  type: 'Owned' | '3PL' | 'Cold Chain'
  totalAreaSqFt: number
  utilizationPercent: number
  zonesCount: number
  racksCount: number
  binsCount: number
  coldStorageEnabled: boolean
  openAlertsCount: number
  status: 'Active' | 'Under Maintenance'
  managerName: string
  staffCount: number
  // Legacy fields preserved for Dashboard compatibility
  utilization: number
  accuracy: number
  openAlerts: number
  coldStorageStatus: 'Normal' | 'Warning' | 'Critical'
}
export default Warehouse
