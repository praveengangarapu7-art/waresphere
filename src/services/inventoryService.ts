import { mockSKUs } from '../mock-data/skus'
import { SKU } from '../types/sku'

// In-memory mutable store, same pattern as inboundService/outboundService/
// movementService — persists edits for the life of the session (reset on a
// full page reload), never a real backend.
let inMemorySkus: SKU[] = [...mockSKUs]

export const inventoryService = {
  async getSKUs(): Promise<SKU[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemorySkus), 400));
  },
  async getSKUById(id: string): Promise<SKU | undefined> {
    return new Promise(resolve => setTimeout(() => resolve(inMemorySkus.find(s => s.id === id)), 200));
  },
  /**
   * Persists a fully-computed SKU (typically produced by
   * utils/applySkuMovement) back into the in-memory store. Callers compute
   * the new quantity/movements/status themselves — this only replaces the
   * record, mirroring updateInboundOrder/updateOutboundOrder/updateMovement.
   */
  async updateSKU(updated: SKU): Promise<SKU> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemorySkus = inMemorySkus.map(s => (s.id === updated.id ? updated : s))
        resolve(updated)
      }, 150)
    })
  }
}
export default inventoryService
