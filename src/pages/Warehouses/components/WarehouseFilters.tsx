import React from 'react'
import { Search, X } from 'lucide-react'
import styles from './WarehouseFilters.module.css'

interface WarehouseFiltersProps {
  search: string
  setSearch: (val: string) => void
  selectedState: string
  setSelectedState: (val: string) => void
  selectedType: string
  setSelectedType: (val: string) => void
  selectedStatus: string
  setSelectedStatus: (val: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
  hasActiveFilters: boolean
}

export const WarehouseFilters: React.FC<WarehouseFiltersProps> = ({
  search,
  setSearch,
  selectedState,
  setSelectedState,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  onClear,
  filteredCount,
  totalCount,
  hasActiveFilters
}) => {
  const states = ['Maharashtra', 'Tamil Nadu', 'Telangana', 'Karnataka', 'Haryana', 'Gujarat']
  const types = ['Owned', '3PL', 'Cold Chain']
  const statuses = ['Active', 'Under Maintenance']

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
            placeholder="Search name or city..."
            className={styles.searchInput}
          />
        </div>

        {/* State Filter */}
        <div className={styles.filterItem}>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className={styles.select}
          >
            <option value="all">All States</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className={styles.filterItem}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
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
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> facilities
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
export default WarehouseFilters
