import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { NAVIGATION_ITEMS } from '../../../constants/navigation'
import { useRole } from '../../../hooks/useRole'
import { useAuth } from '../../../hooks/useAuth'
import { Modal } from '../../ui/Modal/Modal'
import { HelpCircle } from 'lucide-react'
import * as Icons from 'lucide-react'
import styles from './Sidebar.module.css'

export const Sidebar: React.FC = () => {
  const { activeRole } = useRole()
  const { user } = useAuth()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // NavItem.roles, when set, is an allow-list — if the active role isn't in
  // it, the item is hidden. Items with no `roles` (the default) are visible
  // to every role, preserving existing behavior for everything not
  // explicitly restricted.
  const visibleItems = NAVIGATION_ITEMS.filter(item => !item.roles || item.roles.includes(activeRole))

  // Settings renders in its own bottom section (per the new design), not
  // the main nav list — same underlying NAVIGATION_ITEMS entry (and same
  // role-filtering), just a different presentation.
  const mainItems = visibleItems.filter(item => item.name !== 'Settings')
  const settingsItem = visibleItems.find(item => item.name === 'Settings')

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <img src="/logo.png" alt="WareSphere" className={styles.logoImg} />
      </div>

      <nav className={styles.nav}>
        {mainItems.map((item) => {
          // Dynamic Lucide Icon Resolution
          const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
              }
            >
              <IconComponent size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.bottomSection}>
        {settingsItem && (
          <NavLink
            to={settingsItem.path}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
            }
          >
            <Icons.Settings size={20} />
            <span>{settingsItem.name}</span>
          </NavLink>
        )}
        <button className={styles.navItem} onClick={() => setIsHelpOpen(true)}>
          <HelpCircle size={20} />
          <span>Help & Documentation</span>
        </button>

        {user && (
          <div className={styles.profileRow}>
            <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
            <div className={styles.profileText}>
              <span className={styles.profileName}>{user.name}</span>
              <span className={styles.profileRole}>{activeRole}</span>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help & Documentation">
        <p className={styles.helpModalText}>
          In-app documentation isn't available in this demo environment yet.
          For questions, reach out to your WareSphere account administrator.
        </p>
      </Modal>
    </aside>
  )
}
