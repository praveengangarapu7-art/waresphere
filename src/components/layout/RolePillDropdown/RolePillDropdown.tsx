import React, { useState, useEffect, useRef } from 'react'
import { useRole } from '../../../hooks/useRole'
import { useAuth } from '../../../hooks/useAuth'
import { ROLES, UserRole } from '../../../constants/roles'
import {
  ChevronDown,
  Check,
  User,
  ShieldCheck,
  Warehouse,
  TrendingUp,
  ClipboardCheck,
  Scale,
  Settings,
  FileText
} from 'lucide-react'
import styles from './RolePillDropdown.module.css'

export const RolePillDropdown: React.FC = () => {
  const { activeRole } = useRole()
  const { switchUserRole } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => setIsOpen(prev => !prev)

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  // Close on Escape
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

  const handleRoleSelect = (role: UserRole) => {
    switchUserRole(role)
    setIsOpen(false)
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Warehouse Staff':
        return <User size={14} />
      case 'Warehouse Supervisor':
        return <ShieldCheck size={14} />
      case 'Warehouse Manager':
        return <Warehouse size={14} />
      case 'Operations Director':
        return <TrendingUp size={14} />
      case 'Quality Inspector':
        return <ClipboardCheck size={14} />
      case 'Finance/Compliance':
        return <Scale size={14} />
      case 'IT Admin':
        return <Settings size={14} />
      case 'External Auditor':
        return <FileText size={14} />
      default:
        return null
    }
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={styles.pillButton}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={styles.roleName}>{activeRole}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Switch Simulation Role</span>
          </div>
          <div className={styles.divider} />
          <ul className={styles.menuList}>
            {ROLES.map(role => {
              const isActive = role === activeRole
              return (
                <li key={role}>
                  <button
                    onClick={() => handleRoleSelect(role)}
                    className={`${styles.menuItem} ${isActive ? styles.activeItem : ''}`}
                  >
                    <span className={styles.itemIcon}>{getRoleIcon(role)}</span>
                    <span className={styles.itemLabel}>{role}</span>
                    {isActive && <Check size={14} className={styles.checkIcon} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
export default RolePillDropdown
