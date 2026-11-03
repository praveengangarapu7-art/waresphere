export const generateGS1Barcode = (skuCode: string, batchNo: string, expiryDate: string): string => {
  // Simple GS1 AI (Application Identifier) mock formatting
  // (01) SKU / GTIN, (10) Batch Number, (17) Expiry Date (YYMMDD)
  const cleanSku = skuCode.replace(/[^0-9]/g, '').padEnd(14, '0');
  const cleanBatch = batchNo.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanExpiry = expiryDate.replace(/[^0-9]/g, '');
  return `(01)${cleanSku}(10)${cleanBatch}(17)${cleanExpiry}`;
}
