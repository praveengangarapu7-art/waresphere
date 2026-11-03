export interface LabelTemplate {
  id: string
  name: string
  sizeLabel: string     // e.g. "4×2 in"
  widthIn: number       // inches
  heightIn: number      // inches
  fields: string[]      // which fields to print
  isDefault?: boolean
}

export const mockLabelTemplates: LabelTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Bin Location Label',
    sizeLabel: '2×1 in',
    widthIn: 2,
    heightIn: 1,
    fields: ['Barcode', 'Bin Location', 'Warehouse Name'],
    isDefault: false,
  },
  {
    id: 'tmpl-2',
    name: 'Standard SKU Shelf Label',
    sizeLabel: '4×2 in',
    widthIn: 4,
    heightIn: 2,
    fields: ['Logo', 'Barcode', 'SKU Code', 'Product Name', 'Warehouse Name'],
    isDefault: true,
  },
  {
    id: 'tmpl-3',
    name: 'Batch / Lot Label (with Expiry)',
    sizeLabel: '4×2 in',
    widthIn: 4,
    heightIn: 2,
    fields: ['Barcode', 'SKU Code', 'Product Name', 'Batch Number', 'Expiry Date'],
    isDefault: false,
  },
  {
    id: 'tmpl-4',
    name: 'Shipping / Dispatch Label',
    sizeLabel: '4×6 in',
    widthIn: 4,
    heightIn: 6,
    fields: ['Logo', 'QR Code', 'SKU Code', 'Product Name', 'Batch Number', 'Expiry Date', 'Warehouse Name', 'Bin Location'],
    isDefault: false,
  },
]

export default mockLabelTemplates
