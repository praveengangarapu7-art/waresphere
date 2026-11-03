import React, { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { GenerateLabelsTab } from './components/GenerateLabelsTab'
import { LabelTemplatesTab } from './components/LabelTemplatesTab'
import { HandheldDevicesTab } from './components/HandheldDevicesTab'
import { RfidTab } from './components/RfidTab'
import { Tag, Layout, Tablet, Radio } from 'lucide-react'
import styles from './BarcodeLabels.module.css'

type Tab = 'generate' | 'templates' | 'devices' | 'rfid'

interface TabDef {
  key: Tab
  label: string
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  { key: 'generate',   label: 'Generate Labels',  icon: <Tag     size={14} /> },
  { key: 'templates',  label: 'Label Templates',  icon: <Layout  size={14} /> },
  { key: 'devices',    label: 'Handheld Devices', icon: <Tablet  size={14} /> },
  { key: 'rfid',       label: 'RFID',             icon: <Radio   size={14} /> },
]

export const BarcodeLabels: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generate')

  return (
    <div className={styles.container}>
      <PageHeader
        title="Barcode &amp; Labels"
        description="Generate, print, and manage identification codes across your warehouse network."
      />

      {/* Tab nav */}
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ''}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className={styles.panel}>
        {activeTab === 'generate'  && <GenerateLabelsTab />}
        {activeTab === 'templates' && <LabelTemplatesTab />}
        {activeTab === 'devices'   && <HandheldDevicesTab />}
        {activeTab === 'rfid'      && <RfidTab />}
      </div>
    </div>
  )
}

export default BarcodeLabels
