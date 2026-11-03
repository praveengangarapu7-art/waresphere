import { SKU } from '../types/sku'

const warehousesList = ['wh-mum', 'wh-del', 'wh-blr', 'wh-hyd', 'wh-pne']

const categories = [
  'Pharma',
  'Food & FMCG',
  'Chemicals',
  'Agri-inputs',
  'Auto Components',
  'General'
] as const

const productTemplates = {
  Pharma: [
    { name: 'Amoxicillin 500mg Capsules', unit: 'units' as const, cost: 140, reorder: 500, safety: 100, expiryDays: 360 },
    { name: 'Paracetamol Syrup 60ml', unit: 'units' as const, cost: 45, reorder: 1000, safety: 200, expiryDays: 730 },
    { name: 'Ibuprofen 400mg Tablets', unit: 'units' as const, cost: 85, reorder: 800, safety: 150, expiryDays: 540 },
    { name: 'Metformin 500mg Tablets', unit: 'units' as const, cost: 95, reorder: 1200, safety: 300, expiryDays: 480 },
    { name: 'Atorvastatin 10mg Tablets', unit: 'units' as const, cost: 190, reorder: 600, safety: 100, expiryDays: 360 }
  ],
  'Food & FMCG': [
    { name: 'Basmati Rice 25kg Bag', unit: 'units' as const, cost: 2200, reorder: 100, safety: 20, expiryDays: 180 },
    { name: 'Refined Sunflower Oil 15L Tin', unit: 'units' as const, cost: 1850, reorder: 150, safety: 30, expiryDays: 240 },
    { name: 'Wheat Flour (Atta) 10kg', unit: 'units' as const, cost: 420, reorder: 200, safety: 45, expiryDays: 90 },
    { name: 'Premium Assam Tea 1kg Pack', unit: 'units' as const, cost: 380, reorder: 300, safety: 50, expiryDays: 360 },
    { name: 'Organic Honey 500g Glass Jar', unit: 'units' as const, cost: 290, reorder: 400, safety: 80, expiryDays: 730 }
  ],
  Chemicals: [
    { name: 'Sodium Hypochlorite 12% Solution', unit: 'litres' as const, cost: 75, reorder: 5000, safety: 1000, expiryDays: 120 },
    { name: 'Isopropyl Alcohol (Industrial)', unit: 'litres' as const, cost: 180, reorder: 2000, safety: 400, expiryDays: 730 },
    { name: 'Caustic Soda Flakes 50kg Bag', unit: 'kg' as const, cost: 65, reorder: 4000, safety: 800, expiryDays: 1095 },
    { name: 'Hydrochloric Acid 33%', unit: 'litres' as const, cost: 45, reorder: 8000, safety: 1500, expiryDays: 365 },
    { name: 'Sulphuric Acid Technical Grade', unit: 'litres' as const, cost: 55, reorder: 6000, safety: 1200, expiryDays: 365 }
  ],
  'Agri-inputs': [
    { name: 'NPK 19:19:19 Fertilizer 50kg', unit: 'kg' as const, cost: 25, reorder: 10000, safety: 2000, expiryDays: 730 },
    { name: 'Urea Neem Coated 45kg', unit: 'kg' as const, cost: 6, reorder: 20000, safety: 4000, expiryDays: 1095 },
    { name: 'Glyphosate 41% SL Herbicide', unit: 'litres' as const, cost: 420, reorder: 1500, safety: 300, expiryDays: 730 },
    { name: 'Imidacloprid 17.8% SL Insecticide', unit: 'litres' as const, cost: 850, reorder: 1000, safety: 200, expiryDays: 730 },
    { name: 'DAP (Di-Ammonium Phosphate) 50kg', unit: 'kg' as const, cost: 30, reorder: 8000, safety: 1500, expiryDays: 730 }
  ],
  'Auto Components': [
    { name: 'Maruti Alto Brake Pad Set', unit: 'units' as const, cost: 650, reorder: 200, safety: 40, expiryDays: 0 },
    { name: 'Maruti Swift Clutch Assembly', unit: 'units' as const, cost: 3800, reorder: 50, safety: 10, expiryDays: 0 },
    { name: 'Hyundai i20 Oil Filter', unit: 'units' as const, cost: 220, reorder: 500, safety: 100, expiryDays: 0 },
    { name: 'Honda City Spark Plug Set', unit: 'units' as const, cost: 850, reorder: 300, safety: 60, expiryDays: 0 },
    { name: 'Front Windshield Wiper Blade Set', unit: 'units' as const, cost: 450, reorder: 400, safety: 80, expiryDays: 0 }
  ],
  General: [
    { name: 'N95 Protective Masks', unit: 'units' as const, cost: 15, reorder: 5000, safety: 1000, expiryDays: 0 },
    { name: 'Cardboard Box (Master Shipping)', unit: 'units' as const, cost: 35, reorder: 2000, safety: 500, expiryDays: 0 },
    { name: 'Stretch Wrap Film Roll 5kg', unit: 'units' as const, cost: 650, reorder: 100, safety: 20, expiryDays: 0 },
    { name: 'Heavy Duty Packaging Tape 2-inch', unit: 'units' as const, cost: 45, reorder: 500, safety: 100, expiryDays: 0 },
    { name: 'Wooden Pallet (Euro Standard)', unit: 'units' as const, cost: 1200, reorder: 150, safety: 30, expiryDays: 0 }
  ]
}

// Procedural mock generator
const generateMockSKUs = (): SKU[] => {
  const skus: SKU[] = []
  let globalIndex = 1

  categories.forEach(category => {
    const templates = productTemplates[category]
    
    // Create ~13 SKUs per category to hit ~78 total SKUs
    for (let i = 0; i < 13; i++) {
      const template = templates[i % templates.length]
      const whId = warehousesList[globalIndex % warehousesList.length]
      const zoneLetter = String.fromCharCode(65 + (globalIndex % 4)) // A, B, C, D
      const binNo = `${10 + (globalIndex % 15)}-${globalIndex % 5}`

      // Deterministic pseudo-random generation based on index
      const quantityMultiplier = (globalIndex * 17) % 11
      let quantity = Math.round(template.reorder * (0.1 + quantityMultiplier * 0.3))
      
      // Seed some out of stock and low stock items
      if (globalIndex % 9 === 0) quantity = 0
      else if (globalIndex % 7 === 0) quantity = Math.round(template.safety * 0.7)

      // Expiry tracking logic
      let expiryDate: string | undefined
      if (template.expiryDays > 0) {
        const today = new Date()
        let offsetDays = template.expiryDays
        
        // Seed some expiring and expired items
        if (globalIndex % 8 === 0) {
          offsetDays = 15 // Expiring soon (<30 days)
        } else if (globalIndex % 11 === 0) {
          offsetDays = -10 // Expired
        } else {
          offsetDays = template.expiryDays + (globalIndex % 60)
        }
        
        today.setDate(today.getDate() + offsetDays)
        expiryDate = today.toISOString().split('T')[0]
      }

      // ABC classification
      const abcClasses: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
      const abcClass = abcClasses[globalIndex % 3]

      // Derive valuation method
      const valMethods = ['FIFO' as const, 'LIFO' as const, 'Weighted Average' as const, 'Standard Cost' as const]
      const valuationMethod = valMethods[globalIndex % 4]

      // Compute total value
      const totalValue = quantity * template.cost

      // Derive status logically
      let status: SKU['status'] = 'In Stock'
      const todayStr = new Date().toISOString().split('T')[0]

      if (quantity === 0) {
        status = 'Out of Stock'
      } else if (expiryDate && expiryDate < todayStr) {
        status = 'Expired'
      } else if (expiryDate && (new Date(expiryDate).getTime() - new Date(todayStr).getTime()) < 30 * 24 * 60 * 60 * 1000) {
        status = 'Expiring Soon'
      } else if (quantity <= template.reorder) {
        status = 'Low Stock'
      } else if (globalIndex % 15 === 0) {
        status = 'Dead Stock' // Mock dead stock
      }

      // Movement date
      const moveDate = new Date()
      moveDate.setDate(moveDate.getDate() - (globalIndex % 45))
      const lastMovementDate = moveDate.toISOString().split('T')[0]

      // Pad sku codes
      const categoryCode = category.substring(0, 2).toUpperCase()
      const codeIndex = String(globalIndex).padStart(3, '0')
      const skuCode = `${categoryCode}-${template.name.substring(0, 3).toUpperCase()}-${codeIndex}`

      // 1. Generate Locations (Spanning multiple bins/warehouses)
      const locations: SKU['locations'] = [
        {
          id: `loc-${globalIndex}-1`,
          warehouseId: whId,
          zone: `Zone ${zoneLetter}`,
          bin: `Bin ${binNo}`,
          batchNumber: `BAT-${10000 + globalIndex}`,
          quantity: Math.round(quantity * 0.7)
        }
      ]
      if (quantity > 0) {
        const nextWh = warehousesList[(globalIndex + 1) % warehousesList.length]
        locations.push({
          id: `loc-${globalIndex}-2`,
          warehouseId: nextWh,
          zone: 'Zone A',
          bin: 'Bin 05-2',
          batchNumber: `BAT-${10000 + globalIndex}-B`,
          quantity: quantity - locations[0].quantity
        })
      }

      // 2. Generate Batches (Full Genealogy tracing to receiving event)
      const batches: SKU['batches'] = [
        {
          batchNumber: `BAT-${10000 + globalIndex}`,
          lotNumber: `LOT-${200 + globalIndex}`,
          serialNumber: globalIndex % 4 === 0 ? `SR-${50000 + globalIndex}` : undefined,
          source: 'Aurobindo Pharma Ltd.',
          receivedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          qualityStatus: globalIndex % 15 === 0 ? 'Held' : 'Accepted',
          quantityRemaining: Math.round(quantity * 0.7),
          expiryDate
        }
      ]
      if (quantity > 0) {
        batches.push({
          batchNumber: `BAT-${10000 + globalIndex}-B`,
          lotNumber: `LOT-${200 + globalIndex}-B`,
          source: 'Cipla Depot Mumbai',
          receivedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          qualityStatus: 'Accepted',
          quantityRemaining: quantity - batches[0].quantityRemaining,
          expiryDate
        })
      }

      // 3. Generate Movements (15 Chronological logs representing real activities)
      const movements: SKU['movements'] = []
      let currentQty = quantity
      const users = ['Ranjit Singh', 'Anita Desai', 'Karan Johar', 'Sunita Rao']
      for (let m = 0; m < 15; m++) {
        const typeList = ['Receipt/GRN' as const, 'Putaway' as const, 'Pick' as const, 'Bin Transfer' as const, 'Inter-warehouse Transfer' as const, 'Adjustment' as const, 'Return' as const, 'Dispatch' as const]
        const type = m === 14 ? ('Receipt/GRN' as const) : typeList[(globalIndex + m) % typeList.length]
        
        let delta = 50 + (globalIndex * m * 17) % 300
        if (type === 'Pick' || type === 'Dispatch' || (type === 'Inter-warehouse Transfer' && m % 2 === 0)) {
          delta = -delta
        }
        
        let before = currentQty - delta
        if (before < 0) {
          delta = currentQty
          before = 0
        }
        
        const timestamp = new Date(Date.now() - (m * 2 + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 10:30'
        movements.push({
          id: `mov-${globalIndex}-${m}`,
          type,
          timestamp,
          delta,
          before,
          after: before + delta,
          user: users[(globalIndex + m) % users.length],
          reason: type === 'Adjustment' ? 'Counting Variance' : undefined
        })
        
        currentQty = before
      }

      // 4. Generate 6-month valuation history
      const valuationHistory: SKU['valuationHistory'] = [
        { month: 'Jan', cost: Math.round(template.cost * 0.95) },
        { month: 'Feb', cost: Math.round(template.cost * 0.97) },
        { month: 'Mar', cost: Math.round(template.cost * 0.96) },
        { month: 'Apr', cost: Math.round(template.cost * 0.98) },
        { month: 'May', cost: Math.round(template.cost * 0.99) },
        { month: 'Jun', cost: template.cost }
      ]

      skus.push({
        id: String(globalIndex),
        skuCode,
        name: template.name,
        category,
        warehouseId: whId,
        zone: `Zone ${zoneLetter}`,
        bin: `Bin ${binNo}`,
        batchNumber: `BAT-${10000 + globalIndex}`,
        lotNumber: `LOT-${200 + globalIndex}`,
        serialNumber: globalIndex % 4 === 0 ? `SR-${50000 + globalIndex}` : undefined,
        quantity,
        unit: template.unit,
        abcClass,
        expiryDate,
        valuationMethod,
        unitCost: template.cost,
        totalValue,
        reorderPoint: template.reorder,
        safetyStock: template.safety,
        status,
        lastMovementDate,
        locations,
        batches,
        movements,
        valuationHistory
      })

      globalIndex++
    }
  })

  return skus
}

export const mockSKUs: SKU[] = generateMockSKUs()
export default mockSKUs
