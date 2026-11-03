import { mockCycleCounts } from '../mock-data/cycleCounts'
import { CycleCount } from '../types/cycleCount'

let inMemoryCounts = [...mockCycleCounts]

export const cycleCountService = {
  async getCycleCounts(): Promise<CycleCount[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryCounts), 300))
  },

  async updateCycleCount(updatedCount: CycleCount): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryCounts = inMemoryCounts.map(c => c.id === updatedCount.id ? updatedCount : c)
        resolve()
      }, 200)
    })
  },

  async createCycleCount(newPlan: Omit<CycleCount, 'id'>): Promise<CycleCount> {
    return new Promise(resolve => {
      setTimeout(() => {
        const created: CycleCount = {
          ...newPlan,
          id: `cc-gen-${Date.now()}`
        }
        inMemoryCounts = [created, ...inMemoryCounts]
        resolve(created)
      }, 300)
    })
  }
}
export default cycleCountService
