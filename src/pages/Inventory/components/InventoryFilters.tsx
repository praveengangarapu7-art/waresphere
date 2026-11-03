import React from 'react'
import { Search, X } from 'lucide-react'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './InventoryFilters.module.css'

interface InventoryFiltersProps {
  search: string
  setSearch: (val: string) => void
  selectedWarehouse: string
  setSelectedWarehouse: (val: string) => void
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  selectedAbc: string
  setSelectedAbc: (val: string) => void
  selectedStatus: string
  setSelectedStatus: (val: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  search,
  setSearch,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedCategory,
  setSelectedCategory,
  selectedAbc,
  setSelectedAbc,
  selectedStatus,
  setSelectedStatus,
  onClear,
  filteredCount,
  totalCount,
  hasActiveFilters
}) => {
  const categories = ['Pharma', 'Food & FMCG', 'Chemicals', 'Agri-inputs', 'Auto Components', 'General']
  const abcClasses = ['A', 'B', 'C']
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon', 'Expired', 'Dead Stock']

  return (
    <div className={styles.container}>
      <div className={styles.filtersRow}>
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU code or product name..."
            className={styles.searchInput}
          />
        </div>

        {/* Warehouse Filter */}
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

        {/* Category Filter */}
        <div className={styles.filterItem}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* ABC Class Filter */}
        <div className={styles.filterItem}>
          <select
            value={selectedAbc}
            onChange={(e) => setSelectedAbc(e.target.value)}
            className={styles.select}
          >
            <option value="all">All ABC Classes</option>
            {abcClasses.map(a => (
              <option key={a} value={a}>Class {a}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className={styles.filterItem}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.resultCount}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> SKUs
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
export default InventoryFilters
