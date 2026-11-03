import { mockColdStorageZones, mockDeviationAlerts, mockMaintenanceItems } from '../mock-data/coldStorageReadings'
import { mockInboundOrders } from '../mock-data/inboundOrders'
import { mockOutboundOrders } from '../mock-data/outboundOrders'
import { mockSKUs } from '../mock-data/skus'
import { mockWarehouses } from '../mock-data/warehouses'
import { ColdStorageZone, DeviationAlert, MaintenanceItem } from '../types/coldStorage'
import { InboundOrder } from '../types/inboundOrder'
import { OutboundOrder } from '../types/outboundOrder'
import { SKU } from '../types/sku'

const DAY_MS = 24 * 60 * 60 * 1000

const warehouseById = (id: string) => mockWarehouses.find(warehouse => warehouse.id === id)
const skuById = (id: string) => mockSKUs.find(sku => sku.id === id)
const dateValue = (date?: string) => {
  if (!date) return undefined
  const value = new Date(`${date.slice(0, 10)}T00:00:00`).getTime()
  return Number.isNaN(value) ? undefined : value
}
const daysRemaining = (date?: string) => {
  const expiry = dateValue(date)
  if (expiry === undefined) return undefined
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.ceil((expiry - todayStart) / DAY_MS)
}
const expiryRisk = (days: number): 'expired' | 'critical' | 'high' | 'medium' | 'low' => {
  if (days < 0) return 'expired'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'high'
  if (days <= 60) return 'medium'
  return 'low'
}
const warehouseName = (id: string) => warehouseById(id)?.name ?? id

export interface BatchSearchResult {
  batchNumber: string
  sku: string
  product: string
  warehouse: string
  zone: string
  bin: string
  quantity: number
  expiryDate?: string
  batchStatus: 'Accepted' | 'Held' | 'Rejected'
}

export interface ExpiringProductResult {
  sku: string
  product: string
  batch: string
  warehouse: string
  quantity: number
  expiryDate: string
  daysRemaining: number
  riskLevel: 'expired' | 'critical' | 'high' | 'medium' | 'low'
}

export interface LowStockResult {
  sku: string
  product: string
  currentQuantity: number
  reorderPoint: number
  safetyStock: number
  shortageQuantity: number
  warehouse: string
  status: SKU['status']
}

export interface OutOfStockResult {
  sku: string
  product: string
  quantity: number
  warehouse: string
  status: SKU['status']
}

export interface WarehouseInventorySummary {
  warehouse: string
  totalSKUs: number
  totalQuantity: number
  totalInventoryValue: number
  lowStockCount: number
  outOfStockCount: number
  expiringSoonCount: number
}

export interface ReorderRecommendation {
  sku: string
  product: string
  warehouse: string
  currentQuantity: number
  reorderPoint: number
  safetyStock: number
  recommendedQuantity: number
  priority: 'critical' | 'high' | 'medium'
}

export interface FEFORecommendation {
  sku: string
  product: string
  batch: string
  warehouse: string
  zone: string
  bin: string
  quantity: number
  expiryDate?: string
  daysRemaining?: number
  pickPriority: number
}

export interface InboundPriorityResult {
  orderId: string
  orderNumber: string
  warehouse: string
  status: InboundOrder['status']
  priority: 'critical' | 'high' | 'medium' | 'low'
  reasons: string[]
  daysUntilExpected?: number
  quantityDiscrepancies: { sku: string; expected: number; received: number }[]
}

export interface OutboundPriorityResult {
  orderId: string
  orderNumber: string
  warehouse: string
  status: OutboundOrder['status']
  priority: 'critical' | 'high' | 'medium' | 'low'
  reasons: string[]
  daysUntilDispatch?: number
  pickingProgress: { ordered: number; picked: number }
  packingProgress: { picked: number; packed: number }
}

export interface ColdStorageRiskResult {
  warningZones: ColdStorageZone[]
  criticalZones: ColdStorageZone[]
  temperatureDeviations: { zone: string; warehouse: string; temperature: number; targetMin: number; targetMax: number; deviation: number }[]
  humidityIssues: { zone: string; warehouse: string; humidity: number; reason: string }[]
  sensorHealthProblems: { zone: string; warehouse: string; sensorId: string; problems: string[] }[]
  maintenanceIssues: MaintenanceItem[]
  deviationAlerts: DeviationAlert[]
  limitations: string[]
}

export function findBatch(batchNumber: string): BatchSearchResult | undefined {
  for (const sku of mockSKUs) {
    const batch = sku.batches?.find(item => item.batchNumber === batchNumber)
    if (!batch) continue

    const location = sku.locations?.find(item => item.batchNumber === batchNumber)
    return {
      batchNumber: batch.batchNumber,
      sku: sku.skuCode,
      product: sku.name,
      warehouse: warehouseName(location?.warehouseId ?? sku.warehouseId),
      zone: location?.zone ?? sku.zone,
      bin: location?.bin ?? sku.bin,
      quantity: location?.quantity ?? batch.quantityRemaining,
      expiryDate: batch.expiryDate,
      batchStatus: batch.qualityStatus
    }
  }
  return undefined
}

export function getExpiringProducts(days: number): ExpiringProductResult[] {
  const window = Number.isFinite(days) ? Math.max(0, days) : 0
  return mockSKUs.flatMap(sku => {
    const result = sku.batches?.flatMap(batch => {
      const remaining = daysRemaining(batch.expiryDate)
      if (remaining === undefined || remaining > window) return []
      const location = sku.locations?.find(item => item.batchNumber === batch.batchNumber)
      return [{
        sku: sku.skuCode,
        product: sku.name,
        batch: batch.batchNumber,
        warehouse: warehouseName(location?.warehouseId ?? sku.warehouseId),
        quantity: location?.quantity ?? batch.quantityRemaining,
        expiryDate: batch.expiryDate as string,
        daysRemaining: remaining,
        riskLevel: expiryRisk(remaining)
      }]
    })
    return result ?? []
  })
}

export function getLowStockProducts(): LowStockResult[] {
  return mockSKUs
    .filter(sku => sku.quantity < sku.reorderPoint)
    .map(sku => ({
      sku: sku.skuCode,
      product: sku.name,
      currentQuantity: sku.quantity,
      reorderPoint: sku.reorderPoint,
      safetyStock: sku.safetyStock,
      shortageQuantity: sku.reorderPoint - sku.quantity,
      warehouse: warehouseName(sku.warehouseId),
      status: sku.status
    }))
}

export function getOutOfStockProducts(): OutOfStockResult[] {
  return mockSKUs
    .filter(sku => sku.quantity <= 0)
    .map(sku => ({
      sku: sku.skuCode,
      product: sku.name,
      quantity: sku.quantity,
      warehouse: warehouseName(sku.warehouseId),
      status: sku.status
    }))
}

export function getWarehouseInventorySummary(warehouseId?: string): WarehouseInventorySummary[] {
  const warehouses = warehouseId ? mockWarehouses.filter(warehouse => warehouse.id === warehouseId) : mockWarehouses
  return warehouses.map(warehouse => {
    const skus = mockSKUs.filter(sku => sku.warehouseId === warehouse.id)
    return {
      warehouse: warehouse.name,
      totalSKUs: skus.length,
      totalQuantity: skus.reduce((total, sku) => total + sku.quantity, 0),
      totalInventoryValue: skus.reduce((total, sku) => total + sku.totalValue, 0),
      lowStockCount: skus.filter(sku => sku.quantity > 0 && sku.quantity < sku.reorderPoint).length,
      outOfStockCount: skus.filter(sku => sku.quantity <= 0).length,
      expiringSoonCount: skus.filter(sku => {
        const remaining = daysRemaining(sku.expiryDate)
        return remaining !== undefined && remaining >= 0 && remaining <= 30
      }).length
    }
  })
}

export function getReorderRecommendations(): ReorderRecommendation[] {
  return mockSKUs
    .filter(sku => sku.quantity < sku.reorderPoint)
    .map(sku => ({
      sku: sku.skuCode,
      product: sku.name,
      warehouse: warehouseName(sku.warehouseId),
      currentQuantity: sku.quantity,
      reorderPoint: sku.reorderPoint,
      safetyStock: sku.safetyStock,
      recommendedQuantity: Math.max(0, sku.reorderPoint + sku.safetyStock - sku.quantity),
      priority: sku.quantity <= 0 ? 'critical' : sku.quantity <= sku.safetyStock ? 'high' : 'medium'
    }))
}

export function getFEFORecommendations(skuCode?: string): FEFORecommendation[] {
  return mockSKUs
    .filter(sku => !skuCode || sku.skuCode === skuCode)
    .flatMap(sku => (sku.batches ?? []).flatMap(batch => {
      const locations = sku.locations?.filter(location => location.batchNumber === batch.batchNumber) ?? []
      const entries = locations.length > 0 ? locations : [{ warehouseId: sku.warehouseId, zone: sku.zone, bin: sku.bin, quantity: batch.quantityRemaining }]
      return entries.map(location => ({
        sku: sku.skuCode,
        product: sku.name,
        batch: batch.batchNumber,
        warehouse: warehouseName(location.warehouseId),
        zone: location.zone,
        bin: location.bin,
        quantity: location.quantity,
        expiryDate: batch.expiryDate,
        daysRemaining: daysRemaining(batch.expiryDate)
      }))
    }))
    .sort((left, right) => {
      if (!left.expiryDate) return 1
      if (!right.expiryDate) return -1
      return (dateValue(left.expiryDate) ?? Number.MAX_SAFE_INTEGER) - (dateValue(right.expiryDate) ?? Number.MAX_SAFE_INTEGER)
    })
    .map((item, index) => ({ ...item, pickPriority: index + 1 }))
}

const priorityFromScore = (score: number): 'critical' | 'high' | 'medium' | 'low' =>
  score >= 4 ? 'critical' : score >= 2 ? 'high' : score > 0 ? 'medium' : 'low'

export function getInboundPriorities(): InboundPriorityResult[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return mockInboundOrders.flatMap(order => {
    const reasons: string[] = []
    let score = 0
    const expected = dateValue(order.expectedDate)
    const daysUntilExpected = expected === undefined ? undefined : Math.ceil((expected - today.getTime()) / DAY_MS)
    const discrepancies = order.lineItems.flatMap(item => {
      if (item.receivedQty === undefined || item.receivedQty === item.expectedQty) return []
      return [{ sku: skuById(item.skuId)?.skuCode ?? item.skuId, expected: item.expectedQty, received: item.receivedQty }]
    })

    if (order.status !== 'Completed' && daysUntilExpected !== undefined && daysUntilExpected < 0) { reasons.push('Expected date has passed'); score += 2 }
    if (order.status === 'On Hold') { reasons.push('Order is on hold'); score += 2 }
    if (order.status === 'Quality Inspection') { reasons.push('Quality inspection pending'); score += 1 }
    if (order.status === 'Putaway Pending') { reasons.push('Putaway is pending'); score += 1 }
    if (order.lineItems.some(item => item.qualityStatus === 'Rejected' || item.qualityStatus === 'Hold')) { reasons.push('Quality exception requires attention'); score += 2 }
    if (discrepancies.length > 0) { reasons.push('Received quantity differs from expected quantity'); score += 2 }
    if (score === 0) return []

    return [{ orderId: order.id, orderNumber: order.asnNumber ?? order.grnNumber ?? order.id, warehouse: warehouseName(order.warehouseId), status: order.status, priority: priorityFromScore(score), reasons, daysUntilExpected, quantityDiscrepancies: discrepancies }]
  })
}

export function getOutboundPriorities(): OutboundPriorityResult[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return mockOutboundOrders.flatMap(order => {
    const reasons: string[] = []
    let score = 0
    const dispatch = dateValue(order.requiredDispatchDate)
    const daysUntilDispatch = dispatch === undefined ? undefined : Math.ceil((dispatch - today.getTime()) / DAY_MS)
    const ordered = order.lineItems.reduce((total, item) => total + item.orderedQty, 0)
    const picked = order.lineItems.reduce((total, item) => total + (item.pickedQty ?? 0), 0)
    const packed = order.lineItems.reduce((total, item) => total + (item.packedQty ?? 0), 0)

    if (!['Delivered', 'Dispatched'].includes(order.status) && daysUntilDispatch !== undefined && daysUntilDispatch < 0) { reasons.push('Required dispatch date has passed'); score += 2 }
    if (['Pending', 'Allocated'].includes(order.status)) { reasons.push('Order has not entered picking'); score += 1 }
    if (['Picking', 'Picked'].includes(order.status) && picked < ordered) { reasons.push('Picking is incomplete'); score += 1 }
    if (['Packed', 'Loaded'].includes(order.status) && packed < picked) { reasons.push('Packing is incomplete'); score += 1 }
    if (score === 0) return []

    return [{ orderId: order.id, orderNumber: order.orderNumber, warehouse: warehouseName(order.warehouseId), status: order.status, priority: priorityFromScore(score), reasons, daysUntilDispatch, pickingProgress: { ordered, picked }, packingProgress: { picked, packed } }]
  })
}

export function getColdStorageRisks(): ColdStorageRiskResult {
  const temperatureDeviations = mockColdStorageZones.flatMap(zone => {
    const { temp } = zone.currentReading
    const { min, max } = zone.targetRange
    if (temp >= min && temp <= max) return []
    return [{ zone: zone.zoneName, warehouse: zone.warehouseName, temperature: temp, targetMin: min, targetMax: max, deviation: temp < min ? temp - min : temp - max }]
  })
  const sensorHealthProblems = mockColdStorageZones.flatMap(zone => zone.sensors.flatMap(sensor => {
    const problems = [
      ...(sensor.connectivity === 'Offline' ? ['Offline'] : []),
      ...(sensor.batteryPercent < 20 ? ['Low battery'] : [])
    ]
    return problems.length === 0 ? [] : [{ zone: zone.zoneName, warehouse: zone.warehouseName, sensorId: sensor.id, problems }]
  }))

  return {
    warningZones: mockColdStorageZones.filter(zone => zone.status === 'Warning'),
    criticalZones: mockColdStorageZones.filter(zone => zone.status === 'Critical'),
    temperatureDeviations,
    humidityIssues: [],
    sensorHealthProblems,
    maintenanceIssues: mockMaintenanceItems.filter(item => item.status !== 'On Schedule'),
    deviationAlerts: mockDeviationAlerts.filter(alert => alert.status === 'Ongoing'),
    limitations: ['No humidity thresholds are defined in the existing cold-storage types, so humidity issues cannot be evaluated reliably.']
  }
}

export const warehouseIntelligenceService = {
  findBatch,
  getExpiringProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getWarehouseInventorySummary,
  getReorderRecommendations,
  getFEFORecommendations,
  getInboundPriorities,
  getOutboundPriorities,
  getColdStorageRisks
}

export default warehouseIntelligenceService