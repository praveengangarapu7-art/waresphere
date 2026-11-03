import React from 'react'
import { Search, X } from 'lucide-react'
import { mockWarehouses } from '../../../mock-data/warehouses'
import styles from './TransferFilters.module.css'

interface TransferFiltersProps {
  search: string
  setSearch: (val: string) => void
  selectedWarehouse: string
  setSelectedWarehouse: (val: string) => void
  selectedStatus: string
  setSelectedStatus: (val: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
}

export const TransferFilters: React.FC<TransferFiltersProps> = ({
  search,
  setSearch,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedStatus,
  setSelectedStatus,
  onClear,
  filteredCount,
  totalCount,
  hasActiveFilters
}) => {
  const statuses = ['Requested', 'Pending Approval', 'Approved', 'Rejected', 'In Transit', 'Received', 'Completed']

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
            placeholder="Search movement number, SKU, requester..."
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
            <option value="all">All Facility Locations</option>
            {mockWarehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className={styles.filterItem}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Statuses</option>
            {statuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.resultCount}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> movements logged
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
export default TransferFilters
