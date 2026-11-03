import { mockWarehouses } from '../mock-data/warehouses'
import { Warehouse } from '../types/warehouse'

// In-memory mutable store, same pattern as inboundService/outboundService/
// movementService/inventoryService — persists edits for the life of the
// session (reset on a full page reload), never a real backend.
let inMemoryWarehouses: Warehouse[] = [...mockWarehouses]

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryWarehouses), 300));
  },
  async createWarehouse(newWarehouse: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    return new Promise(resolve => {
      setTimeout(() => {
        const warehouse: Warehouse = {
          ...newWarehouse,
          id: `wh-gen-${Date.now()}`
        }
        inMemoryWarehouses = [warehouse, ...inMemoryWarehouses]
        resolve(warehouse)
      }, 300)
    })
  },
  async updateWarehouse(updated: Warehouse): Promise<Warehouse> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryWarehouses = inMemoryWarehouses.map(w => (w.id === updated.id ? updated : w))
        resolve(updated)
      }, 200)
    })
  }
}
export default warehouseService
