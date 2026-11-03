import { mockInboundOrders } from '../mock-data/inboundOrders'
import { InboundOrder } from '../types/inboundOrder'

let inMemoryOrders = [...mockInboundOrders]

export const inboundService = {
  async getInboundOrders(): Promise<InboundOrder[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryOrders), 300))
  },
  
  async updateInboundOrder(updatedOrder: InboundOrder): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryOrders = inMemoryOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
        resolve()
      }, 200)
    })
  },

  async createInboundOrder(newOrder: Omit<InboundOrder, 'id'>): Promise<InboundOrder> {
    return new Promise(resolve => {
      setTimeout(() => {
        const order: InboundOrder = {
          ...newOrder,
          id: `in-gen-${Date.now()}`
        }
        inMemoryOrders = [order, ...inMemoryOrders]
        resolve(order)
      }, 300)
    })
  }
}
export default inboundService
