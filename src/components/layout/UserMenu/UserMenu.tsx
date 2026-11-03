import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useRole } from '../../../hooks/useRole'
import { User as UserIcon, Settings, HelpCircle, LogOut } from 'lucide-react'
import { Modal } from '../../ui/Modal/Modal'
import styles from './UserMenu.module.css'

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const { activeRole } = useRole()
  const navigate = useNavigate()
  const location = useLocation()

  const [isOpen, setIsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => setIsOpen(prev => !prev)

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  // Close on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  if (!user) return null

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={styles.triggerButton}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <UserIcon size={20} className={styles.avatarIcon} />
        <span className={styles.username}>{user.name}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.details}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </div>
            <span className={styles.roleTag}>{activeRole}</span>
          </div>

          <div className={styles.divider} />

          <ul className={styles.menuList}>
            <li>
              <button onClick={handleSettingsClick} className={styles.menuItem}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => { setIsOpen(false); setIsHelpOpen(true) }}
                className={styles.menuItem}
              >
                <HelpCircle size={16} />
                <span>Help & Documentation</span>
              </button>
            </li>
          </ul>

          <div className={styles.divider} />

          <button onClick={handleLogout} className={`${styles.menuItem} ${styles.logoutItem}`}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help & Documentation">
        <p className={styles.helpModalText}>
          In-app documentation isn't available in this demo environment yet.
          For questions, reach out to your WareSphere account administrator.
        </p>
      </Modal>
    </div>
  )
}
