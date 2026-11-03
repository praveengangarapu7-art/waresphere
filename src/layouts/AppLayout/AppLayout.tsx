import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar/Sidebar'
import { Topbar } from '../../components/layout/Topbar/Topbar'
import styles from './AppLayout.module.css'

export const AppLayout: React.FC = () => {
  const { pathname } = useLocation()

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Topbar />
        {/* key forces re-mount → triggers page-fade animation on route change */}
        <main className={styles.content} key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
