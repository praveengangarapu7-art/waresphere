import { SKU, SkuMovement } from '../types/sku'

/**
 * Pure function that applies a quantity delta to a SKU, producing a new SKU
 * object with an appended SkuMovement entry — the shared mock-layer
 * "business logic" behind every cross-module stock effect (Inbound
 * receiving, Outbound dispatch, Transfers adjustments, manual stock
 * adjustment). This mirrors what a real backend would eventually enforce
 * transactionally; here it's simulated so every module that touches
 * inventory quantities does so through one consistent, auditable path
 * instead of each page hand-rolling its own math.
 */
export function applySkuMovement(
  sku: SKU,
  delta: number,
  type: SkuMovement['type'],
  opts?: { user?: string; reason?: string }
): SKU {
  const before = sku.quantity
  const after = Math.max(0, before + delta)
  const now = new Date()
  const timestamp =
    now.toISOString().split('T')[0] +
    ' ' +
    String(now.getHours()).padStart(2, '0') +
    ':' +
    String(now.getMinutes()).padStart(2, '0')

  const movement: SkuMovement = {
    id: `mov-${type.replace(/[^a-zA-Z]/g, '').toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp,
    delta,
    before,
    after,
    user: opts?.user || 'System',
    reason: opts?.reason
  }

  const updatedLocations = sku.locations ? [...sku.locations] : []
  if (updatedLocations.length > 0) {
    updatedLocations[0] = { ...updatedLocations[0], quantity: Math.max(0, updatedLocations[0].quantity + delta) }
  }

  const updatedBatches = sku.batches ? [...sku.batches] : []
  if (updatedBatches.length > 0) {
    updatedBatches[0] = { ...updatedBatches[0], quantityRemaining: Math.max(0, updatedBatches[0].quantityRemaining + delta) }
  }

  return {
    ...sku,
    quantity: after,
    totalValue: after * sku.unitCost,
    lastMovementDate: movement.timestamp,
    movements: [movement, ...(sku.movements || [])],
    locations: updatedLocations,
    batches: updatedBatches,
    status:
      after === 0
        ? 'Out of Stock'
        : after <= sku.safetyStock
          ? 'Low Stock'
          : sku.status === 'Out of Stock' || sku.status === 'Low Stock'
            ? 'In Stock'
            : sku.status
  }
}
