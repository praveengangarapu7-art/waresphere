export interface Zone {
  id: string
  warehouseId: string
  name: string
  type: 'Ambient' | 'Cold Storage' | 'Hazmat'
  tempRange?: { min: number; max: number }
  capacityPercent: number
  racksCount: number
  binsCount: number
  skuCount: number
  layoutPosition: { x: number; y: number; width: number; height: number }
}

export interface BinDetail {
  id: string
  binCode: string
  occupancyPercent: number
  skuName?: string
  skuCode?: string
  quantity?: number
  unit?: string
}

export interface ShelfDetail {
  id: string
  shelfName: string
  bins: BinDetail[]
}

export interface RackDetail {
  id: string
  rackName: string
  shelves: ShelfDetail[]
}

export interface ZoneHierarchy {
  zoneId: string
  racks: RackDetail[]
}

// Procedural zones generator
const generateMockZones = (): Zone[] => {
  const warehouses = ['wh-mum', 'wh-del', 'wh-blr', 'wh-hyd', 'wh-pne', 'wh-chn', 'wh-ahm']
  const zones: Zone[] = []

  warehouses.forEach(whId => {
    // 4 zones per warehouse
    const hasCold = whId === 'wh-mum' || whId === 'wh-del' || whId === 'wh-blr' || whId === 'wh-hyd'
    
    // Zone 1: Bulk Ambient / Fast Moving
    zones.push({
      id: `z-${whId}-1`,
      warehouseId: whId,
      name: 'Dry Area A (Bulk)',
      type: 'Ambient',
      capacityPercent: 78,
      racksCount: 15,
      binsCount: 450,
      skuCount: 120,
      layoutPosition: { x: 5, y: 5, width: 45, height: 35 }
    })

    // Zone 2: Dry Racking / High-Rack
    zones.push({
      id: `z-${whId}-2`,
      warehouseId: whId,
      name: 'Dry Area B (High-Rack)',
      type: 'Ambient',
      capacityPercent: 82,
      racksCount: 12,
      binsCount: 360,
      skuCount: 95,
      layoutPosition: { x: 5, y: 45, width: 45, height: 50 }
    })

    // Zone 3: Cold storage if enabled, else dry storage C
    if (hasCold) {
      zones.push({
        id: `z-${whId}-3`,
        warehouseId: whId,
        name: 'Cold Chamber C-04',
        type: 'Cold Storage',
        tempRange: { min: 2, max: 8 },
        capacityPercent: 74,
        racksCount: 8,
        binsCount: 240,
        skuCount: 40,
        layoutPosition: { x: 55, y: 5, width: 40, height: 90 }
      })
    } else {
      zones.push({
        id: `z-${whId}-3`,
        warehouseId: whId,
        name: 'Dry Area C (Racks)',
        type: 'Ambient',
        capacityPercent: 62,
        racksCount: 10,
        binsCount: 300,
        skuCount: 70,
        layoutPosition: { x: 55, y: 5, width: 40, height: 90 }
      })
    }

    // Zone 4: Hazmat vault or special General zone
    const isHazmat = whId === 'wh-mum' || whId === 'wh-hyd' || whId === 'wh-del'
    if (isHazmat) {
      zones.push({
        id: `z-${whId}-4`,
        warehouseId: whId,
        name: 'Hazardous Vault D-01',
        type: 'Hazmat',
        capacityPercent: 48,
        racksCount: 5,
        binsCount: 150,
        skuCount: 20,
        layoutPosition: { x: 100, y: 5, width: 55, height: 40 }
      })
    } else {
      zones.push({
        id: `z-${whId}-4`,
        warehouseId: whId,
        name: 'Sorting & Packing D-02',
        type: 'Ambient',
        capacityPercent: 55,
        racksCount: 6,
        binsCount: 180,
        skuCount: 15,
        layoutPosition: { x: 100, y: 5, width: 55, height: 40 }
      })
    }
  })

  return zones
}

// Procedural generation of Zone -> Rack -> Shelf -> Bin hierarchy
export const generateZoneHierarchy = (zoneId: string): RackDetail[] => {
  const racks: RackDetail[] = []
  
  // 3 racks per zone
  for (let r = 1; r <= 3; r++) {
    const shelves: ShelfDetail[] = []
    
    // 3 shelves per rack
    for (let s = 1; s <= 3; s++) {
      const bins: BinDetail[] = []
      
      // 4 bins per shelf
      for (let b = 1; b <= 4; b++) {
        const binCode = `${zoneId.split('-')[2] || 'A'}-R${r}-S${s}-B${b}`.toUpperCase()
        const occupancy = 30 + ((r * s * b * 7) % 65)
        
        // Mock SKUs for some bins
        let skuName: string | undefined
        let skuCode: string | undefined
        let quantity: number | undefined
        let unit: string | undefined

        if (b % 2 === 0) {
          skuCode = `PHR-AMX-00${r}`
          skuName = r === 1 ? 'Amoxicillin 500mg' : 'Paracetamol Syrup'
          quantity = 200 + (r * s * 15)
          unit = 'units'
        }

        bins.push({
          id: `bin-${zoneId}-${r}-${s}-${b}`,
          binCode,
          occupancyPercent: occupancy,
          skuName,
          skuCode,
          quantity,
          unit
        })
      }

      shelves.push({
        id: `shelf-${zoneId}-${r}-${s}`,
        shelfName: `Shelf S${s}`,
        bins
      })
    }

    racks.push({
      id: `rack-${zoneId}-${r}`,
      rackName: `Rack R${r}`,
      shelves
    })
  }

  return racks
}

export const mockZones: Zone[] = generateMockZones()
