import { KPIValues } from '../types/common'

// Historical 12-week trend data
export const mockKpiHistory = [
  { week: 'Wk 1', accuracy: 95.8, otif: 87.2 },
  { week: 'Wk 2', accuracy: 96.0, otif: 87.5 },
  { week: 'Wk 3', accuracy: 96.1, otif: 88.0 },
  { week: 'Wk 4', accuracy: 95.9, otif: 88.2 },
  { week: 'Wk 5', accuracy: 96.2, otif: 88.4 },
  { week: 'Wk 6', accuracy: 96.4, otif: 88.9 },
  { week: 'Wk 7', accuracy: 96.6, otif: 89.1 },
  { week: 'Wk 8', accuracy: 96.5, otif: 89.5 },
  { week: 'Wk 9', accuracy: 96.8, otif: 89.2 },
  { week: 'Wk 10', accuracy: 96.7, otif: 89.0 },
  { week: 'Wk 11', accuracy: 96.9, otif: 89.4 },
  { week: 'Wk 12', accuracy: 97.2, otif: 89.6 }
]

export const mockKPIs: KPIValues[] = [
  { 
    id: 'kpi-accuracy', 
    title: 'Inventory Accuracy', 
    value: '96.4%', 
    change: 0.6, 
    trend: 'up', 
    target: '> 98%', 
    history: mockKpiHistory 
  },
  { 
    id: 'kpi-otif', 
    title: 'Order Fulfillment (OTIF)', 
    value: '89.2%', 
    change: 2.4, 
    trend: 'up', 
    target: '> 95%', 
    history: mockKpiHistory 
  },
  { 
    id: 'kpi-picking', 
    title: 'Picking Accuracy', 
    value: '97.8%', 
    change: 0.4, 
    trend: 'up', 
    target: '> 99%' 
  },
  { 
    id: 'kpi-utilization', 
    title: 'Warehouse Utilization', 
    value: '71.0%', 
    change: -1.2, 
    trend: 'down', 
    target: '75-85%' 
  },
  { 
    id: 'kpi-shrinkage', 
    title: 'Shrinkage / Loss Rate', 
    value: '1.8%', 
    change: 0.3, 
    trend: 'up', 
    target: '< 1%' 
  },
  { 
    id: 'kpi-cold-chain', 
    title: 'Cold Storage Compliance', 
    value: '98.1%', 
    change: 0.9, 
    trend: 'up', 
    target: '> 99.5%' 
  }
]
