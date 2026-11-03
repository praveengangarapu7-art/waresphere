import React, { useState, useMemo } from 'react'
import { Zone, generateZoneHierarchy, RackDetail, ShelfDetail, BinDetail } from '../../../mock-data/zones'
import { ChevronDown, ChevronRight, Search, LayoutGrid, Server, Layers, Box } from 'lucide-react'
import styles from './ZonesBinsTab.module.css'

interface ZonesBinsTabProps {
  zones: Zone[]
}

export const ZonesBinsTab: React.FC<ZonesBinsTabProps> = ({ zones }) => {
  const [search, setSearch] = useState('')
  
  // Track expanded rows in local state: key layout like zoneId, rackId, shelfId
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Pre-generate hierarchy for all zones
  const zoneHierarchies = useMemo(() => {
    return zones.reduce<Record<string, RackDetail[]>>((acc, zone) => {
      acc[zone.id] = generateZoneHierarchy(zone.id)
      return acc
    }, {})
  }, [zones])

  // Filter matching bins or hierarchies based on search query
  const filteredData = useMemo(() => {
    if (!search.trim()) return zones

    const q = search.toLowerCase()
    
    // Filter zones that contain matching bins
    return zones.filter(zone => {
      const racks = zoneHierarchies[zone.id] || []
      return racks.some(r => 
        r.shelves.some(s => 
          s.bins.some(b => b.binCode.toLowerCase().includes(q) || (b.skuName && b.skuName.toLowerCase().includes(q)))
        )
      )
    })
  }, [zones, search, zoneHierarchies])

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.searchBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Jump directly to bin code (e.g. A-R1-S2-B3) or SKU..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.treeContainer}>
        {filteredData.map(zone => {
          const isZoneExpanded = expandedRows[zone.id] || search.trim() !== ''
          const racks = zoneHierarchies[zone.id] || []

          return (
            <div key={zone.id} className={styles.zoneNode}>
              {/* Zone Row */}
              <div className={styles.row} onClick={() => toggleRow(zone.id)}>
                <div className={styles.rowTitle}>
                  {isZoneExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <LayoutGrid size={16} className={styles.nodeIconZone} />
                  <span><strong>{zone.name}</strong></span>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.capLabel}>Occupancy:</span>
                  <span className={zone.capacityPercent > 80 ? styles.alertText : styles.normalText}>
                    {zone.capacityPercent}%
                  </span>
                </div>
              </div>

              {/* Racks List */}
              {isZoneExpanded && (
                <div className={styles.childContainer}>
                  {racks.map(rack => {
                    const rackKey = `${zone.id}-${rack.id}`
                    const isRackExpanded = expandedRows[rackKey] || search.trim() !== ''

                    return (
                      <div key={rack.id} className={styles.rackNode}>
                        <div className={styles.row} onClick={() => toggleRow(rackKey)}>
                          <div className={styles.rowTitle}>
                            {isRackExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Server size={14} className={styles.nodeIconRack} />
                            <span>{rack.rackName}</span>
                          </div>
                        </div>

                        {/* Shelves List */}
                        {isRackExpanded && (
                          <div className={styles.childContainer}>
                            {rack.shelves.map(shelf => {
                              const shelfKey = `${rackKey}-${shelf.id}`
                              const isShelfExpanded = expandedRows[shelfKey] || search.trim() !== ''

                              return (
                                <div key={shelf.id} className={styles.shelfNode}>
                                  <div className={styles.row} onClick={() => toggleRow(shelfKey)}>
                                    <div className={styles.rowTitle}>
                                      {isShelfExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                      <Layers size={12} className={styles.nodeIconShelf} />
                                      <span>{shelf.shelfName}</span>
                                    </div>
                                  </div>

                                  {/* Bins List */}
                                  {isShelfExpanded && (
                                    <div className={styles.binsGrid}>
                                      {shelf.bins
                                        .filter(b => !search.trim() || b.binCode.toLowerCase().includes(search.toLowerCase()) || (b.skuName && b.skuName.toLowerCase().includes(search.toLowerCase())))
                                        .map(bin => (
                                          <div key={bin.id} className={`${styles.binCard} ${bin.occupancyPercent > 80 ? styles.binAlert : ''}`}>
                                            <div className={styles.binHeader}>
                                              <Box size={12} className={styles.binIcon} />
                                              <span className={styles.binCode}>{bin.binCode}</span>
                                              <span className={styles.binOccupancy}>{bin.occupancyPercent}% Occupied</span>
                                            </div>
                                            {bin.skuCode ? (
                                              <div className={styles.binSkuInfo}>
                                                <span className={styles.skuName}>{bin.skuName}</span>
                                                <span className={styles.skuQty}>{bin.quantity} {bin.unit}</span>
                                              </div>
                                            ) : (
                                              <span className={styles.emptyBin}>Empty Location</span>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default ZonesBinsTab
