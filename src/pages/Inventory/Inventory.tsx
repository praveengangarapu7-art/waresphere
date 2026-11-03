import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { Table } from '../../components/ui/Table/Table'
import { Badge } from '../../components/ui/Badge/Badge'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Card } from '../../components/ui/Card/Card'
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader'
import { DonutChart, DonutChartSegment } from '../../components/charts/DonutChart/DonutChart'
import { InventoryFilters } from './components/InventoryFilters'
import { InventorySummaryStats } from './components/InventorySummaryStats'
import { inventoryService } from '../../services/inventoryService'
import { mockWarehouses } from '../../mock-data/warehouses'
import { formatCurrency } from '../../utils/formatCurrency'
import { SKU } from '../../types/sku'
import { FileUp, FileDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Inventory.module.css'

const STATUS_COLORS: Record<SKU['status'], string> = {
  'In Stock': 'var(--color-status-success)',
  'Low Stock': 'var(--color-status-pending)',
  'Out of Stock': 'var(--color-status-danger)',
  'Expiring Soon': 'var(--color-cyan)',
  'Expired': '#E8664F',
  'Dead Stock': 'var(--color-status-draft)'
}

type SortColumn = 'skuCode' | 'name' | 'quantity' | 'totalValue' | 'expiryDate' | 'abcClass'
type SortDir = 'asc' | 'desc'

export const Inventory: React.FC = () => {
  const navigate = useNavigate()
  
  // State
  const [allSkus, setAllSkus] = useState<SKU[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [warehouse, setWarehouse] = useState('all')
  const [category, setCategory] = useState('all')
  const [abcClass, setAbcClass] = useState('all')
  const [status, setStatus] = useState('all')
  
  // Sorting
  const [sortCol, setSortCol] = useState<SortColumn>('skuCode')
  const [sortDirection, setSortDirection] = useState<SortDir>('asc')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Fetch SKUs
  useEffect(() => {
    const fetchSKUs = async () => {
      setLoading(true)
      const data = await inventoryService.getSKUs()
      setAllSkus(data)
      setLoading(false)
    }
    fetchSKUs()
  }, [])

  // Clear filters
  const handleClearFilters = () => {
    setSearch('')
    setWarehouse('all')
    setCategory('all')
    setAbcClass('all')
    setStatus('all')
    setPage(1)
  }

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return search !== '' || warehouse !== 'all' || category !== 'all' || abcClass !== 'all' || status !== 'all'
  }, [search, warehouse, category, abcClass, status])

  // Stock health breakdown — computed client-side from the same full,
  // unfiltered SKU list InventorySummaryStats already uses; no new data.
  const stockHealthData: DonutChartSegment[] = useMemo(() => {
    const statuses: SKU['status'][] = ['In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon', 'Expired', 'Dead Stock']
    return statuses
      .map(s => ({ label: s, value: allSkus.filter(sku => sku.status === s).length, color: STATUS_COLORS[s] }))
      .filter(seg => seg.value > 0)
  }, [allSkus])

  // Jump the existing status filter from a Stock Health legend click —
  // reuses the same setStatus setter InventoryFilters already drives.
  const handleStockHealthSegmentClick = (label: string) => {
    setStatus(label)
  }

  // Filtered and Sorted SKUs
  const filteredAndSortedSkus = useMemo(() => {
    let result = [...allSkus]

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s => 
        s.skuCode.toLowerCase().includes(q) || 
        s.name.toLowerCase().includes(q) ||
        s.batchNumber.toLowerCase().includes(q)
      )
    }

    // 2. Warehouse
    if (warehouse !== 'all') {
      result = result.filter(s => s.warehouseId === warehouse)
    }

    // 3. Category
    if (category !== 'all') {
      result = result.filter(s => s.category === category)
    }

    // 4. ABC Class
    if (abcClass !== 'all') {
      result = result.filter(s => s.abcClass === abcClass)
    }

    // 5. Stock Status
    if (status !== 'all') {
      result = result.filter(s => s.status === status)
    }

    // 6. Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortCol] || ''
      let bVal: any = b[sortCol] || ''

      if (sortCol === 'expiryDate') {
        aVal = a.expiryDate ? new Date(a.expiryDate).getTime() : 9999999999999
        bVal = b.expiryDate ? new Date(b.expiryDate).getTime() : 9999999999999
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal)
      } else {
        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number)
      }
    })

    return result
  }, [allSkus, search, warehouse, category, abcClass, status, sortCol, sortDirection])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [search, warehouse, category, abcClass, status])

  // Paginated SKUs
  const paginatedSkus = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAndSortedSkus.slice(start, start + pageSize)
  }, [filteredAndSortedSkus, page, pageSize])

  const totalPages = Math.ceil(filteredAndSortedSkus.length / pageSize)

  const handleSort = (column: SortColumn) => {
    if (sortCol === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(column)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (skuId: string) => {
    navigate(`/inventory/${skuId}`)
  }

  const handleExport = () => {
    alert('Simulating CSV Export: Initiating download of WareSphere-Inventory-Report.csv')
  }

  const handleImport = () => {
    alert('Simulating Excel Import: ERP gateway connected. Waiting for file payload.')
  }

  const getAbcVariant = (abc: string) => {
    if (abc === 'A') return 'warning' // Amber
    if (abc === 'B') return 'primary' // Blue
    return 'default' // Gray
  }

  const getStatusVariant = (stat: string) => {
    switch (stat) {
      case 'In Stock':
        return 'success'
      case 'Low Stock':
      case 'Expiring Soon':
        return 'warning'
      case 'Out of Stock':
      case 'Expired':
        return 'danger'
      default:
        return 'default' // Dead Stock
    }
  }

  const getExpiryDateStyle = (expiryStr?: string) => {
    if (!expiryStr) return ''
    const today = new Date()
    const expiry = new Date(expiryStr)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 7) return styles.expiryAlertRed
    if (diffDays <= 30) return styles.expiryAlertAmber
    return ''
  }

  const getWarehouseName = (id: string) => {
    const found = mockWarehouses.find(w => w.id === id)
    return found ? found.name.split(' ')[0] : id
  }

  if (loading) {
    return <div className={styles.loadingState}>Loading inventory ledger...</div>
  }

  return (
    <div className={styles.container}>
      <PageHeader
        eyebrow="Inventory Intelligence"
        title="Inventory Ledger"
        description="Monitor stock levels, movement, and demand signals across your network."
        actions={
          <>
            <button onClick={handleImport} className={styles.btnSecondary}>
              <FileUp size={16} />
              <span>Import ERP/Excel</span>
            </button>
            <button onClick={handleExport} className={styles.btnPrimary}>
              <FileDown size={16} />
              <span>Export Ledger</span>
            </button>
          </>
        }
      />

      {/* Summary Stat Strip */}
      <InventorySummaryStats skus={allSkus} />

      {/* Stock Health — real status breakdown; clicking a segment jumps
          the existing status filter below to that state. */}
      {stockHealthData.length > 0 && (
        <div>
          <SectionHeader eyebrow="Stock Health" title="Status breakdown across the network" />
          <Card interactive={false} className={styles.stockHealthCard}>
            <DonutChart
              data={stockHealthData}
              centerValue={allSkus.length}
              centerLabel="SKUs"
              onSegmentClick={handleStockHealthSegmentClick}
            />
          </Card>
        </div>
      )}

      {/* Dynamic Filters bar */}
      <InventoryFilters
        search={search}
        setSearch={setSearch}
        selectedWarehouse={warehouse}
        setSelectedWarehouse={setWarehouse}
        selectedCategory={category}
        setSelectedCategory={setCategory}
        selectedAbc={abcClass}
        setSelectedAbc={setAbcClass}
        selectedStatus={status}
        setSelectedStatus={setStatus}
        onClear={handleClearFilters}
        filteredCount={filteredAndSortedSkus.length}
        totalCount={allSkus.length}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Inventory Table */}
      {filteredAndSortedSkus.length === 0 ? (
        <EmptyState
          title="No SKU Records Found"
          description="We couldn't find any stock items matching your active search filters. Try clearing filters to view all ledgers."
          action={
            <button onClick={handleClearFilters} className={styles.btnPrimary}>
              Clear Active Filters
            </button>
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table
            headers={[
              'SKU Code',
              'Product Name',
              'Location',
              'Batch/Lot',
              'Quantity',
              'ABC',
              'Expiry Date',
              'Status',
              'Value'
            ]}
          >
            {paginatedSkus.map(sku => (
              <tr key={sku.id} onClick={() => handleRowClick(sku.id)} className={styles.row}>
                <td className={styles.skuCode}><code>{sku.skuCode}</code></td>
                <td>
                  <div className={styles.productCell}>
                    <span className={styles.productName}>{sku.name}</span>
                    <span className={styles.productCategory}>{sku.category}</span>
                  </div>
                </td>
                <td className={styles.locationCell}>
                  <span>{getWarehouseName(sku.warehouseId)}</span>
                  <span className={styles.zoneText}>{sku.zone} · {sku.bin}</span>
                </td>
                <td>
                  <div className={styles.batchCell}>
                    <span className={styles.batchNo}>{sku.batchNumber}</span>
                    <span className={styles.lotNo}>{sku.lotNumber}</span>
                  </div>
                </td>
                <td className={styles.numberCell}>
                  <strong>{sku.quantity.toLocaleString('en-IN')}</strong>{' '}
                  <span className={styles.unitText}>{sku.unit}</span>
                </td>
                <td>
                  <Badge variant={getAbcVariant(sku.abcClass)}>{sku.abcClass}</Badge>
                </td>
                <td className={getExpiryDateStyle(sku.expiryDate)}>
                  {sku.expiryDate || '—'}
                </td>
                <td>
                  <Badge variant={getStatusVariant(sku.status)}>{sku.status}</Badge>
                </td>
                <td className={styles.numberCell}>
                  <strong>{formatCurrency(sku.totalValue)}</strong>
                </td>
              </tr>
            ))}
          </Table>

          {/* Table Footer with Pagination controls */}
          <div className={styles.tableFooter}>
            <div className={styles.pageSizeRow}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className={styles.pageSizeSelect}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className={styles.paginationControls}>
              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className={styles.paginationButtons}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={styles.pBtn}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={styles.pBtn}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
