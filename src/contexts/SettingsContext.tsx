import React, { createContext, useState, ReactNode } from 'react'

export interface NotifPref {
  id: string
  label: string
  description: string
  email: boolean
  sms: boolean
  inApp: boolean
}

const defaultNotifPrefs: NotifPref[] = [
  { id: 'n-cold', label: 'Cold Chain Breach Alerts', description: 'Temperature or humidity threshold violations', email: true, sms: true, inApp: true },
  { id: 'n-low-stock', label: 'Low Stock Warnings', description: 'SKU stock falling below reorder point', email: true, sms: false, inApp: true },
  { id: 'n-otif', label: 'OTIF Deviation Alerts', description: 'Fulfillment rate dropping below target', email: true, sms: false, inApp: true },
  { id: 'n-cycle', label: 'Cycle Count Variance', description: 'Variance exceeding acceptable threshold', email: false, sms: false, inApp: true },
  { id: 'n-ai', label: 'AI Insight Digests', description: 'Daily summary of AI-generated recommendations', email: true, sms: false, inApp: false },
  { id: 'n-gst', label: 'GST E-Way Bill Expiry', description: 'Alerts for e-way bills expiring within 24 hours', email: true, sms: true, inApp: true }
]

interface SettingsContextType {
  defaultWarehouseId: string
  setDefaultWarehouseId: (id: string) => void
  cycleCountFrequency: string
  setCycleCountFrequency: (freq: string) => void
  autoReorderEnabled: boolean
  setAutoReorderEnabled: (enabled: boolean) => void
  notifPrefs: NotifPref[]
  toggleNotifPref: (id: string, channel: 'email' | 'sms' | 'inApp') => void
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Holds preference-like settings (default warehouse scope, cycle-count
 * frequency, auto-reorder toggle, notification channel prefs) at the app
 * level — same Context pattern as Auth/Role/Theme — so they persist across
 * navigation for the rest of the session, instead of resetting every time
 * Settings unmounts (as plain component-local useState would).
 */
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('all')
  const [cycleCountFrequency, setCycleCountFrequency] = useState('weekly')
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(true)
  const [notifPrefs, setNotifPrefs] = useState<NotifPref[]>(defaultNotifPrefs)

  const toggleNotifPref = (id: string, channel: 'email' | 'sms' | 'inApp') => {
    setNotifPrefs(prev => prev.map(p => (p.id === id ? { ...p, [channel]: !p[channel] } : p)))
  }

  return (
    <SettingsContext.Provider
      value={{
        defaultWarehouseId,
        setDefaultWarehouseId,
        cycleCountFrequency,
        setCycleCountFrequency,
        autoReorderEnabled,
        setAutoReorderEnabled,
        notifPrefs,
        toggleNotifPref
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
