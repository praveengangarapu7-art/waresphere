import React from 'react'
import { Package, Coins, AlertTriangle, Clock } from 'lucide-react'
import { StatCard } from '../../../components/ui/StatCard/StatCard'
import { formatCurrency } from '../../../utils/formatCurrency'
import { SKU } from '../../../types/sku'
import styles from './InventorySummaryStats.module.css'

interface InventorySummaryStatsProps {
  skus: SKU[]
}

export const InventorySummaryStats: React.FC<InventorySummaryStatsProps> = ({ skus }) => {
  // Calculations based on full unfiltered dataset
  const totalSKUs = skus.length
  
  const totalValuation = skus.reduce((sum, sku) => sum + sku.totalValue, 0)
  
  const lowStockCount = skus.filter(sku => sku.status === 'Low Stock' || sku.status === 'Out of Stock').length
  
  const expiringSoonCount = skus.filter(sku => sku.status === 'Expiring Soon' || sku.status === 'Expired').length

  // Valuation format helper (Converting to Lakhs/Crores if needed for readability)
  const formatValuation = (val: number) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} L`
    }
    return formatCurrency(val)
  }

  return (
    <div className={styles.container}>
      <StatCard
        title="Total SKUs"
        value={totalSKUs}
        icon={<Package size={18} />}
      />
      <StatCard
        title="Stock Valuation"
        value={formatValuation(totalValuation)}
        icon={<Coins size={18} />}
      />
      <StatCard
        title="Low Stock / Out of Stock"
        value={lowStockCount}
        icon={<AlertTriangle size={18} />}
        variant={lowStockCount > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="Expiring / Expired"
        value={expiringSoonCount}
        icon={<Clock size={18} />}
        variant={expiringSoonCount > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}
export default InventorySummaryStats
