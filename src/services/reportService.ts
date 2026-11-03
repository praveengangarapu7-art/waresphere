import { mockKPIs } from '../mock-data/kpis'
import { KPIValues } from '../types/common'

export const reportService = {
  async getKpis(warehouseId?: string): Promise<KPIValues[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!warehouseId || warehouseId === 'all') {
          resolve(mockKPIs)
          return
        }

        // Return slightly modified KPI values tailored to the selected warehouse to simulate real data changes
        const scopedKPIs = mockKPIs.map(kpi => {
          let val = kpi.value
          let change = kpi.change
          let trend = kpi.trend

          if (warehouseId === 'wh-mum') {
            if (kpi.id === 'kpi-accuracy') { val = '98.2%'; change = 1.2; trend = 'up' }
            if (kpi.id === 'kpi-otif') { val = '91.5%'; change = 3.1; trend = 'up' }
            if (kpi.id === 'kpi-utilization') { val = '76.4%' }
          } else if (warehouseId === 'wh-del') {
            if (kpi.id === 'kpi-accuracy') { val = '96.4%'; change = -0.8; trend = 'down' }
            if (kpi.id === 'kpi-otif') { val = '86.1%'; change = -1.2; trend = 'down' }
            if (kpi.id === 'kpi-utilization') { val = '75.0%' }
          } else if (warehouseId === 'wh-blr') {
            if (kpi.id === 'kpi-accuracy') { val = '99.1%'; change = 0.8; trend = 'up' }
            if (kpi.id === 'kpi-otif') { val = '94.2%'; change = 2.0; trend = 'up' }
            if (kpi.id === 'kpi-utilization') { val = '35.7%' }
          } else if (warehouseId === 'wh-hyd') {
            if (kpi.id === 'kpi-accuracy') { val = '97.8%'; change = 0.5; trend = 'up' }
            if (kpi.id === 'kpi-otif') { val = '89.5%'; change = 0.7; trend = 'up' }
            if (kpi.id === 'kpi-utilization') { val = '86.0%' }
          } else if (warehouseId === 'wh-pne') {
            if (kpi.id === 'kpi-accuracy') { val = '95.8%'; change = -1.4; trend = 'down' }
            if (kpi.id === 'kpi-otif') { val = '88.0%'; change = 0.2; trend = 'up' }
            if (kpi.id === 'kpi-utilization') { val = '71.0%' }
          }

          return {
            ...kpi,
            value: val,
            change,
            trend: trend as 'up' | 'down' | 'neutral'
          }
        })

        resolve(scopedKPIs)
      }, 350)
    })
  }
}
