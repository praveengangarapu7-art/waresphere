import { mockStockMovements } from '../mock-data/movements'
import { StockMovement } from '../types/movement'

let inMemoryMovements = [...mockStockMovements]

export const movementService = {
  async getMovements(): Promise<StockMovement[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryMovements), 300))
  },
  
  async updateMovement(updatedMovement: StockMovement): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryMovements = inMemoryMovements.map(m => m.id === updatedMovement.id ? updatedMovement : m)
        resolve()
      }, 200)
    })
  },

  async createMovement(newMovement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    return new Promise(resolve => {
      setTimeout(() => {
        const movement: StockMovement = {
          ...newMovement,
          id: `mov-gen-${Date.now()}`
        }
        inMemoryMovements = [movement, ...inMemoryMovements]
        resolve(movement)
      }, 300)
    })
  }
}
export default movementService
