export interface KPITrendRecord {
  week: string
  accuracy: number
  otif: number
}

export interface KPIValues {
  id: string
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
  target: string
  history?: KPITrendRecord[]
}
