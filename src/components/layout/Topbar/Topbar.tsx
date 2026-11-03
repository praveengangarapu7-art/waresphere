import React, { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { UserMenu } from '../UserMenu/UserMenu'
import { RolePillDropdown } from '../RolePillDropdown/RolePillDropdown'
import styles from './Topbar.module.css'

interface Notification {
  id: string
  message: string
  timestamp: string
}

const initialNotifications: Notification[] = [
  { id: 'n1', message: 'Cold Storage Zone C-2 temperature deviation resolved', timestamp: '10 min ago' },
  { id: 'n2', message: 'Low stock alert: Amoxicillin 500mg dropping below reorder point', timestamp: '1 hr ago' },
  { id: 'n3', message: 'Cycle count CC-2026-014 pending your approval', timestamp: '3 hr ago' }
]

export const Topbar: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  return (
    <header className={styles.topbar}>
      <div className={styles.searchArea}>
        {/* Placeholder search or context bar */}
      </div>
      <div className={styles.actionsArea}>
        <RolePillDropdown />
        <div className={styles.notifWrapper} ref={wrapperRef}>
          <button className={styles.iconButton} onClick={() => setIsOpen(prev => !prev)}>
            <Bell size={20} />
            {notifications.length > 0 && <span className={styles.notifDot} />}
          </button>
          {isOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifDropdownHeader}>
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <button className={styles.notifClearBtn} onClick={() => setNotifications([])}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>You're all caught up.</div>
              ) : (
                <ul className={styles.notifList}>
                  {notifications.map(n => (
                    <li key={n.id} className={styles.notifItem}>
                      <span className={styles.notifMessage}>{n.message}</span>
                      <span className={styles.notifTimestamp}>{n.timestamp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
