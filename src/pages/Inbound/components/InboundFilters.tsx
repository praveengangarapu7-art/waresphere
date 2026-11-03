import React from 'react'
import { Search, X } from 'lucide-react'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './InboundFilters.module.css'

interface InboundFiltersProps {
  search: string
  setSearch: (val: string) => void
  selectedWarehouse: string
  setSelectedWarehouse: (val: string) => void
  selectedSource: string
  setSelectedSource: (val: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
}

export const InboundFilters: React.FC<InboundFiltersProps> = ({
  search,
  setSearch,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedSource,
  setSelectedSource,
  onClear,
  filteredCount,
  totalCount,
  hasActiveFilters
}) => {
  const sources = ['Supplier Delivery', 'Inter-warehouse Transfer', 'Customer Return']

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
            placeholder="Search ASN/GRN, supplier, PO..."
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

        {/* Source */}
        <div className={styles.filterItem}>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Inbound Sources</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.resultCount}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> inbound entries
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
export default InboundFilters
