import React from 'react'
import styles from './Tabs.module.css'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`${styles.tabsWrapper} ${className}`}>
      <div className={styles.tabsList} role="tablist">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`${styles.tabBtn} ${isActive ? styles.active : ''}`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
export default Tabs
