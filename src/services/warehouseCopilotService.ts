import {
  findBatch,
  getExpiringProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getWarehouseInventorySummary,
  getReorderRecommendations,
  getFEFORecommendations,
  getInboundPriorities,
  getOutboundPriorities,
  getColdStorageRisks,
} from './warehouseIntelligenceService'

// Deterministic keyword-rule router for warehouse questions. No LLM involved —
// `detectIntent` is the single seam to swap for a model-based classifier later;
// every other function here just shapes real service data into a message.

export type CopilotIntent =
  | 'batch-lookup'
  | 'expiry'
  | 'low-stock'
  | 'out-of-stock'
  | 'inventory-summary'
  | 'replenishment'
  | 'fefo'
  | 'inbound'
  | 'outbound'
  | 'cold-storage'
  | 'unsupported'

export interface CopilotQueryResult<T = unknown> {
  intent: CopilotIntent
  success: boolean
  data: T | null
  message: string
}

const DEFAULT_EXPIRY_WINDOW_DAYS = 30

const normalizeQuestion = (question: string): string =>
  question.trim().toLowerCase().replace(/[?!.]/g, '')

const includesAny = (text: string, keywords: string[]): boolean =>
  keywords.some(keyword => text.includes(keyword))

// First matching rule wins. Order matters: more specific phrases are checked
// before broader/generic ones (e.g. "out of stock" before "low stock" before
// the catch-all "summary").
const BATCH_KEYWORDS = ['batch']
const EXPIRY_KEYWORDS = ['expir'] // matches expiry, expiring, expire, expired
const COLD_STORAGE_KEYWORDS = ['cold storage', 'cold-storage', 'cold chain', 'cold-chain', 'temperature', 'refrigerat', 'freezer', 'chiller']
const INBOUND_KEYWORDS = ['inbound', 'asn', 'grn', 'incoming shipment', 'incoming order', 'receiving']
const OUTBOUND_KEYWORDS = ['outbound', 'dispatch', 'sales order', 'delivery order', 'outgoing shipment']
const FEFO_KEYWORDS = ['fefo', 'pick first', 'first expiry', 'what should we pick', 'picking priority', 'picking order']
const OUT_OF_STOCK_KEYWORDS = ['out of stock', 'out-of-stock', 'stockout', 'stocked out', 'zero stock']
const LOW_STOCK_KEYWORDS = ['low stock', 'low-stock', 'low in stock', 'running low', 'running out']
const REPLENISHMENT_KEYWORDS = ['replenish', 'reorder', 're-order', 're order', 'restock']
const INVENTORY_SUMMARY_KEYWORDS = ['inventory summary', 'warehouse summary', 'how is inventory', 'inventory status', 'inventory overview', 'stock summary', 'summary']

const detectIntent = (normalized: string): CopilotIntent => {
  if (includesAny(normalized, BATCH_KEYWORDS)) return 'batch-lookup'
  if (includesAny(normalized, EXPIRY_KEYWORDS)) return 'expiry'
  if (includesAny(normalized, COLD_STORAGE_KEYWORDS)) return 'cold-storage'
  if (includesAny(normalized, INBOUND_KEYWORDS)) return 'inbound'
  if (includesAny(normalized, OUTBOUND_KEYWORDS)) return 'outbound'
  if (includesAny(normalized, FEFO_KEYWORDS)) return 'fefo'
  if (includesAny(normalized, OUT_OF_STOCK_KEYWORDS)) return 'out-of-stock'
  if (includesAny(normalized, LOW_STOCK_KEYWORDS)) return 'low-stock'
  if (includesAny(normalized, REPLENISHMENT_KEYWORDS)) return 'replenishment'
  if (includesAny(normalized, INVENTORY_SUMMARY_KEYWORDS)) return 'inventory-summary'
  return 'unsupported'
}

// Batch numbers in mock data look like "BAT-10001" / "BAT-10001-B"; this also
// accepts looser forms like "A123" from the task's own example questions.
const extractBatchNumber = (question: string): string | undefined => {
  const match = question.match(/\b([A-Za-z]{1,10}-?\d{2,10}(?:-[A-Za-z0-9]+)?)\b/)
  return match ? match[1].toUpperCase() : undefined
}

const extractDays = (question: string): number | undefined => {
  const match = question.match(/(\d{1,4})\s*day/i)
  return match ? parseInt(match[1], 10) : undefined
}

// SKU codes are generated as 2 letters - 3 letters - 3 digits (e.g. "PH-AMO-001").
const extractSkuCode = (question: string): string | undefined => {
  const match = question.match(/\b[A-Za-z]{2}-[A-Za-z]{3}-\d{3}\b/)
  return match ? match[0].toUpperCase() : undefined
}

const listOrNone = <T,>(items: T[], describe: (item: T) => string, noneMessage: string, noun: string): string => {
  if (items.length === 0) return noneMessage
  const preview = items.slice(0, 3).map(describe)
  const remainder = items.length - preview.length
  return `${items.length} ${noun} found: ${preview.join('; ')}${remainder > 0 ? `; and ${remainder} more` : ''}.`
}

export function handleCopilotQuery(question: string): CopilotQueryResult {
  const trimmed = question.trim()
  if (trimmed.length === 0) {
    return { intent: 'unsupported', success: false, data: null, message: 'Please enter a warehouse question.' }
  }

  const intent = detectIntent(normalizeQuestion(trimmed))

  switch (intent) {
    case 'batch-lookup': {
      const batchNumber = extractBatchNumber(trimmed)
      if (!batchNumber) {
        return {
          intent,
          success: false,
          data: null,
          message: 'No batch number could be identified in the question. Try including the exact batch number, e.g. "Where is batch BAT-10001?"',
        }
      }
      const result = findBatch(batchNumber)
      if (!result) {
        return { intent, success: false, data: null, message: `No batch found matching "${batchNumber}".` }
      }
      return {
        intent,
        success: true,
        data: result,
        message: `Batch ${result.batchNumber} (SKU ${result.sku} — ${result.product}) is at ${result.warehouse}, ${result.zone}, ${result.bin}. Quantity: ${result.quantity}. Status: ${result.batchStatus}.${result.expiryDate ? ` Expiry date: ${result.expiryDate}.` : ''}`,
      }
    }

    case 'expiry': {
      const days = extractDays(trimmed) ?? DEFAULT_EXPIRY_WINDOW_DAYS
      const data = getExpiringProducts(days)
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.sku} batch ${item.batch} (${item.daysRemaining} day(s) remaining, ${item.riskLevel})`,
          `No products are expiring within ${days} days.`,
          `batch(es) expiring within ${days} days`
        ),
      }
    }

    case 'low-stock': {
      const data = getLowStockProducts()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.sku} (${item.currentQuantity}/${item.reorderPoint} at ${item.warehouse})`,
          'No products are currently below their reorder point.',
          'SKU(s) low in stock'
        ),
      }
    }

    case 'out-of-stock': {
      const data = getOutOfStockProducts()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.sku} at ${item.warehouse}`,
          'No products are currently out of stock.',
          'SKU(s) out of stock'
        ),
      }
    }

    case 'inventory-summary': {
      const data = getWarehouseInventorySummary()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.warehouse}: ${item.totalSKUs} SKUs, ${item.totalQuantity.toLocaleString('en-IN')} units, ${item.lowStockCount} low stock, ${item.outOfStockCount} out of stock`,
          'No warehouse inventory data is available.',
          'warehouse(s) summarized'
        ),
      }
    }

    case 'replenishment': {
      const data = getReorderRecommendations()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.sku} — recommend ${item.recommendedQuantity.toLocaleString('en-IN')} units (${item.priority})`,
          'No products currently need replenishment.',
          'SKU(s) recommended for reorder'
        ),
      }
    }

    case 'fefo': {
      const skuCode = extractSkuCode(trimmed)
      const data = getFEFORecommendations(skuCode)
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `#${item.pickPriority} ${item.sku} batch ${item.batch}${item.expiryDate ? ` (expires ${item.expiryDate})` : ' (no expiry date)'}`,
          skuCode ? `No batches found for SKU ${skuCode}.` : 'No batches are available for FEFO picking.',
          'batch(es) in FEFO pick order'
        ),
      }
    }

    case 'inbound': {
      const data = getInboundPriorities()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.orderNumber} at ${item.warehouse} (${item.priority}): ${item.reasons.join(', ')}`,
          'No inbound orders currently need attention.',
          'inbound order(s) flagged'
        ),
      }
    }

    case 'outbound': {
      const data = getOutboundPriorities()
      return {
        intent,
        success: true,
        data,
        message: listOrNone(
          data,
          item => `${item.orderNumber} at ${item.warehouse} (${item.priority}): ${item.reasons.join(', ')}`,
          'No outbound orders currently need attention.',
          'outbound order(s) flagged'
        ),
      }
    }

    case 'cold-storage': {
      const data = getColdStorageRisks()
      const totalRiskZones = data.criticalZones.length + data.warningZones.length
      return {
        intent,
        success: true,
        data,
        message: totalRiskZones === 0
          ? 'No cold storage zones currently show a temperature risk.'
          : `${data.criticalZones.length} zone(s) critical, ${data.warningZones.length} zone(s) in warning. ${data.sensorHealthProblems.length} sensor issue(s), ${data.maintenanceIssues.length} maintenance issue(s), ${data.deviationAlerts.length} ongoing deviation alert(s).`,
      }
    }

    default:
      return {
        intent: 'unsupported',
        success: false,
        data: null,
        message: 'This question could not be confidently matched to a supported warehouse intelligence query. Try asking about a batch number, expiring products, low/out-of-stock items, inventory summary, reorder recommendations, FEFO pick order, inbound/outbound priorities, or cold storage risks.',
      }
  }
}

export const warehouseCopilotService = {
  handleCopilotQuery,
}

export default warehouseCopilotService
