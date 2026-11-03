import React, { useState } from 'react'
import { OutboundOrder } from '../../../types/outboundOrder'
import { mockWarehouses } from '../../../mock-data/warehouses'
import { formatCurrency } from '../../../utils/formatCurrency'
import styles from './DocumentPreview.module.css'

interface DocumentPreviewProps {
  order: OutboundOrder
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ order }) => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'challan' | 'packing' | 'eway'>('invoice')

  const originWarehouse = mockWarehouses.find(w => w.id === order.warehouseId)
  const originState = originWarehouse?.state || 'Maharashtra'
  const isIntrastate = originState.toLowerCase() === order.consigneeState.toLowerCase()

  // Computed values
  const baseValue = order.invoiceValue / 1.18 // Back-compute base value assuming 18% average GST
  const gstAmount = order.invoiceValue - baseValue
  const cgst = isIntrastate ? gstAmount / 2 : 0
  const sgst = isIntrastate ? gstAmount / 2 : 0
  const igst = isIntrastate ? 0 : gstAmount

  const ewayEligible = order.invoiceValue > 50000

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.docTabs}>
        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          className={`${styles.tabBtn} ${activeTab === 'invoice' ? styles.active : ''}`}
        >
          Tax Invoice
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('challan')}
          className={`${styles.tabBtn} ${activeTab === 'challan' ? styles.active : ''}`}
        >
          Delivery Challan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('packing')}
          className={`${styles.tabBtn} ${activeTab === 'packing' ? styles.active : ''}`}
        >
          Packing List
        </button>
        {ewayEligible && (
          <button
            type="button"
            onClick={() => setActiveTab('eway')}
            className={`${styles.tabBtn} ${activeTab === 'eway' ? styles.active : ''}`}
          >
            e-Way Bill
          </button>
        )}
      </div>

      {/* Document Sheet Viewport */}
      <div className={styles.sheet}>
        {activeTab === 'invoice' && (
          <div className={styles.invoiceDoc}>
            {/* Header */}
            <div className={styles.docHeader}>
              <div className={styles.companyBlock}>
                <h3>WARESPHERE LOGISTICS SOLUTIONS</h3>
                <p>{originWarehouse?.address || 'MIDC Zone, Pune'}</p>
                <p>State: {originState} · GSTIN: <strong>{originWarehouse?.gstin || '27AABCW1842A1Z5'}</strong></p>
              </div>
              <div className={styles.docTypeBlock}>
                <h2>TAX INVOICE</h2>
                <p>Invoice No: <strong>INV-{order.orderNumber.split('-')[2]}</strong></p>
                <p>Date: {order.orderDate}</p>
              </div>
            </div>

            {/* Consignee Billing info */}
            <div className={styles.consigneeBlock}>
              <div className={styles.col}>
                <span className={styles.blockTitle}>Billed To (Consignee)</span>
                <strong>{order.customerName}</strong>
                <p>{order.consigneeAddress}</p>
                <p>State: {order.consigneeState} · GSTIN: <strong>{order.consigneeGstin || 'URD (Unregistered)'}</strong></p>
              </div>
              <div className={styles.col}>
                <span className={styles.blockTitle}>Transport Details</span>
                <p>Carrier: {order.logisticsPartner || 'Safexpress'}</p>
                <p>Vehicle: {order.vehicleNumber || 'MH-12-QQ-4412'}</p>
              </div>
            </div>

            {/* Line items Table */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Description (SKU)</th>
                  <th>HSN Code</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Taxable Value</th>
                  <th>GST Type</th>
                  <th>GST Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((item, idx) => {
                  const itemTotal = order.invoiceValue / order.lineItems.length
                  const itemBase = itemTotal / 1.18

                  return (
                    <tr key={idx}>
                      <td><strong>SKU #{item.skuId}</strong></td>
                      <td><code>30049099</code></td>
                      <td>{item.orderedQty} units</td>
                      <td>{formatCurrency(itemBase / item.orderedQty)}</td>
                      <td>{formatCurrency(itemBase)}</td>
                      <td>{isIntrastate ? 'CGST/SGST' : 'IGST'}</td>
                      <td>18%</td>
                      <td>{formatCurrency(itemTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Tax Summary Totals */}
            <div className={styles.summaryTotals}>
              <div className={styles.totalsBlock}>
                <div className={styles.row}>
                  <span>Total Taxable Base:</span>
                  <strong>{formatCurrency(baseValue)}</strong>
                </div>
                {isIntrastate ? (
                  <>
                    <div className={styles.row}>
                      <span>CGST (9%):</span>
                      <strong>{formatCurrency(cgst)}</strong>
                    </div>
                    <div className={styles.row}>
                      <span>SGST (9%):</span>
                      <strong>{formatCurrency(sgst)}</strong>
                    </div>
                  </>
                ) : (
                  <div className={styles.row}>
                    <span>IGST (18%):</span>
                    <strong>{formatCurrency(igst)}</strong>
                  </div>
                )}
                <div className={`${styles.row} ${styles.grandTotal}`}>
                  <span>Grand Invoice Total:</span>
                  <strong>{formatCurrency(order.invoiceValue)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challan' && (
          <div className={styles.invoiceDoc}>
            <div className={styles.docHeader}>
              <div className={styles.companyBlock}>
                <h3>WARESPHERE LOGISTICS SOLUTIONS</h3>
                <p>State: {originState}</p>
              </div>
              <div className={styles.docTypeBlock}>
                <h2>DELIVERY CHALLAN</h2>
                <p>Challan No: <strong>DC-{order.orderNumber.split('-')[2]}</strong></p>
                <p>Date: {order.orderDate}</p>
              </div>
            </div>

            <div className={styles.consigneeBlock}>
              <div className={styles.col}>
                <span className={styles.blockTitle}>Delivery Location</span>
                <strong>{order.customerName}</strong>
                <p>{order.consigneeAddress}</p>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Quantity Shipped</th>
                  <th>UOM</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td><code>SKU-{item.skuId}</code></td>
                    <td>Industrial cargo package</td>
                    <td>{item.orderedQty}</td>
                    <td>Units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'packing' && (
          <div className={styles.invoiceDoc}>
            <div className={styles.docHeader}>
              <div className={styles.companyBlock}>
                <h3>WARESPHERE LOGISTICS SOLUTIONS</h3>
              </div>
              <div className={styles.docTypeBlock}>
                <h2>PACKING LIST</h2>
                <p>Packing List Ref: <strong>PL-{order.orderNumber.split('-')[2]}</strong></p>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Qty (units)</th>
                  <th>Package Type</th>
                  <th>Weight (Est)</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td><code>SKU-{item.skuId}</code></td>
                    <td>{item.orderedQty}</td>
                    <td>Corrugated Box</td>
                    <td>{Math.round(item.orderedQty * 0.15)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'eway' && ewayEligible && (
          <div className={styles.ewayDoc}>
            <div className={styles.ewayHeader}>
              <h3>Government of India · e-Way Bill System</h3>
              <h2>e-WAY BILL</h2>
            </div>
            <div className={styles.ewayMetaGrid}>
              <div>
                <span>e-Way Bill Number:</span>
                <strong>{order.ewayBillNumber || 'EWB-2026-881234'}</strong>
              </div>
              <div>
                <span>Generated Date:</span>
                <strong>{order.orderDate} 10:45 AM</strong>
              </div>
              <div>
                <span>Transaction Type:</span>
                <strong>Outward Supply</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default DocumentPreview
