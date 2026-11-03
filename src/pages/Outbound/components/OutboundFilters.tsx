import React from 'react'
import { Search, X } from 'lucide-react'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './OutboundFilters.module.css'

interface OutboundFiltersProps {
  search: string
  setSearch: (val: string) => void
  selectedWarehouse: string
  setSelectedWarehouse: (val: string) => void
  selectedType: string
  setSelectedType: (val: string) => void
  selectedStrategy: string
  setSelectedStrategy: (val: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
}

export const OutboundFilters: React.FC<OutboundFiltersProps> = ({
  search,
  setSearch,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedType,
  setSelectedType,
  selectedStrategy,
  setSelectedStrategy,
  onClear,
  filteredCount,
  totalCount,
  hasActiveFilters
}) => {
  const types = ['Sales Order', 'Material Request']
  const strategies = ['Single Order', 'Wave', 'Batch']

  return (
    <div className={styles.container}>
      <div className={styles.filtersRow}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number or customer..."
            className={styles.searchInput}
          />
        </div>

        {/* Warehouse */}
        <div className={styles.filterItem}>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Warehouses</option>
            {mockWarehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Order Type */}
        <div className={styles.filterItem}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Order Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Picking Strategy */}
        <div className={styles.filterItem}>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Pick Strategies</option>
            {strategies.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.resultCount}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> dispatch entries
        </span>
        {hasActiveFilters && (
          <button onClick={onClear} className={styles.clearBtn}>
            <X size={14} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  )
}
export default OutboundFilters
