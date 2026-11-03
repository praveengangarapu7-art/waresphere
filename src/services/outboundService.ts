import { mockOutboundOrders } from '../mock-data/outboundOrders'
import { OutboundOrder } from '../types/outboundOrder'

let inMemoryOutboundOrders = [...mockOutboundOrders]

export const outboundService = {
  async getOutboundOrders(): Promise<OutboundOrder[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryOutboundOrders), 300))
  },
  
  async updateOutboundOrder(updatedOrder: OutboundOrder): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        inMemoryOutboundOrders = inMemoryOutboundOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
        resolve()
      }, 200)
    })
  },

  async createOutboundOrder(newOrder: Omit<OutboundOrder, 'id'>): Promise<OutboundOrder> {
    return new Promise(resolve => {
      setTimeout(() => {
        const order: OutboundOrder = {
          ...newOrder,
          id: `out-gen-${Date.now()}`
        }
        inMemoryOutboundOrders = [order, ...inMemoryOutboundOrders]
        resolve(order)
      }, 300)
    })
  }
}
export default outboundService
