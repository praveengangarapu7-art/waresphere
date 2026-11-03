import React, { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader/PageHeader'
import { Badge } from '../../components/ui/Badge/Badge'
import { Table } from '../../components/ui/Table/Table'
import { Modal } from '../../components/ui/Modal/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { useTheme } from '../../hooks/useTheme'
import { useSettings } from '../../hooks/useSettings'
import { mockWarehouses } from '../../mock-data/warehouses'
import { ROLES, UserRole } from '../../constants/roles'
import {
  User,
  Bell,
  Link2,
  Users,
  Building2,
  Save,
  Sun,
  Moon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Database,
  Wifi,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import styles from './Settings.module.css'

// ─── Tab definitions ──────────────────────────────────────────────────────────
type SettingsTab = 'profile' | 'warehouse' | 'notifications' | 'integrations' | 'users'

interface TabDef {
  key: SettingsTab
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const tabs: TabDef[] = [
  { key: 'profile', label: 'Profile', icon: <User size={16} /> },
  { key: 'warehouse', label: 'Warehouse Config', icon: <Building2 size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'integrations', label: 'Integrations', icon: <Link2 size={16} /> },
  { key: 'users', label: 'User Management', icon: <Users size={16} />, adminOnly: true },
]

// ─── Integration definitions ──────────────────────────────────────────────────
const defaultIntegrations = [
  {
    id: 'int-tally',
    name: 'Tally ERP Prime',
    description: 'Syncs inventory valuation, stock ledger and purchase orders with Tally ERP.',
    status: 'Connected',
    lastSync: '12 Jul 2026, 05:55 AM',
    icon: <Database size={20} />,
  },
  {
    id: 'int-gstn',
    name: 'GSTN Portal API Gateway',
    description: 'Automated e-way bill generation and GSTR-1 / GSTR-3B filing integration.',
    status: 'Connected',
    lastSync: '12 Jul 2026, 07:00 AM',
    icon: <ShieldCheck size={20} />,
  },
  {
    id: 'int-zebra',
    name: 'Zebra Barcode Scanner API',
    description: 'Real-time scan-to-putaway and pick confirmation via Zebra TC70 / MC9300 scanners.',
    status: 'Connected',
    lastSync: 'Live',
    icon: <Wifi size={20} />,
  },
  {
    id: 'int-shopify',
    name: 'Shopify Commerce Integration',
    description: 'Bi-directional order sync from Shopify stores to outbound fulfilment pipeline.',
    status: 'Disconnected',
    lastSync: 'Never',
    icon: <Link2 size={20} />,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export const Settings: React.FC = () => {
  const { user, users, updateProfile, addUser } = useAuth()
  const { activeRole } = useRole()
  const { theme, toggleTheme } = useTheme()
  const {
    defaultWarehouseId,
    setDefaultWarehouseId,
    cycleCountFrequency,
    setCycleCountFrequency,
    autoReorderEnabled,
    setAutoReorderEnabled,
    notifPrefs,
    toggleNotifPref
  } = useSettings()

  const isAdmin = activeRole === 'IT Admin' || activeRole === 'Operations Director'
  const isAuditor = activeRole === 'External Auditor'

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [profileCompany, setProfileCompany] = useState(user?.companyName || '')
  const [savedProfile, setSavedProfile] = useState(false)

  // Password change
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [warehouseSaved, setWarehouseSaved] = useState(false)

  // Integrations — local to this tab; not a service since there is no real
  // backend integration for any of these yet (see the module's own gaps
  // report). Test/Disconnect/Connect give real, visible mock feedback
  // instead of being no-ops.
  const [integrationList, setIntegrationList] = useState(defaultIntegrations)
  const [testingIntegrationId, setTestingIntegrationId] = useState<string | null>(null)

  // Invite user modal (admin-only)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('Warehouse Staff')
  const [inviteError, setInviteError] = useState('')

  const handleSaveProfile = () => {
    updateProfile({ name: profileName, email: profileEmail, companyName: profileCompany })
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 3000)
  }

  const handleSavePassword = () => {
    if (!oldPassword || !newPassword) return
    // No real backend auth exists yet to verify/change a password against —
    // this remains a visual confirmation only, unlike Profile/Warehouse
    // Config/Notifications which now persist via AuthContext/SettingsContext.
    setPasswordSaved(true)
    setOldPassword('')
    setNewPassword('')
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  const handleSaveWarehouse = () => {
    setWarehouseSaved(true)
    setTimeout(() => setWarehouseSaved(false), 3000)
  }

  const handleTestConnection = (id: string) => {
    setTestingIntegrationId(id)
    setTimeout(() => {
      setIntegrationList(prev => prev.map(i => (i.id === id ? { ...i, lastSync: 'Just now' } : i)))
      setTestingIntegrationId(null)
    }, 1200)
  }

  const handleDisconnect = (id: string) => {
    setIntegrationList(prev => prev.map(i => (i.id === id ? { ...i, status: 'Disconnected', lastSync: 'Never' } : i)))
  }

  const handleConnect = (id: string) => {
    setIntegrationList(prev => prev.map(i => (i.id === id ? { ...i, status: 'Connected', lastSync: 'Just now' } : i)))
  }

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return
    const created = addUser({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole })
    if (!created) {
      setInviteError('A user with this email address already exists.')
      return
    }
    setIsInviteModalOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('Warehouse Staff')
    setInviteError('')
  }

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'IT Admin' || role === 'Operations Director') return 'primary' as const
    if (role === 'Warehouse Manager' || role === 'Warehouse Supervisor') return 'info' as const
    if (role === 'Quality Inspector') return 'warning' as const
    if (role === 'Finance/Compliance') return 'success' as const
    if (role === 'External Auditor') return 'secondary' as const
    return 'default' as const
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Settings"
        description="Configure your account, warehouse preferences, notifications, and system integrations."
      />

      <div className={styles.layout}>
        {/* Sidebar tab nav */}
        <nav className={styles.sidebar}>
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.navItem} ${activeTab === tab.key ? styles.navItemActive : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Theme toggle at bottom of sidebar */}
          <div className={styles.themeToggleArea}>
            <span className={styles.themeLabel}>Interface Theme</span>
            <button className={styles.themeToggleBtn} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </button>
          </div>
        </nav>

        {/* Content panel */}
        <div className={styles.content}>

          {/* ── PROFILE ──────────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Account Profile</h2>

              <div className={styles.avatarRow}>
                <div className={styles.avatar}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.avatarName}>{user?.name}</div>
                  <div className={styles.avatarRole}><Badge variant={getRoleBadgeVariant(activeRole)}>{activeRole}</Badge></div>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    className={styles.input}
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    disabled={isAuditor}
                    placeholder="Your full name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    disabled={isAuditor}
                    placeholder="your@email.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company / Organization</label>
                  <input
                    className={styles.input}
                    value={profileCompany}
                    onChange={e => setProfileCompany(e.target.value)}
                    disabled={isAuditor}
                    placeholder="Company name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Assigned Role</label>
                  <input className={styles.input} value={activeRole} disabled />
                </div>
              </div>

              {!isAuditor && (
                <div className={styles.formActions}>
                  {savedProfile && (
                    <span className={styles.savedMsg}><CheckCircle size={14} /> Profile saved successfully</span>
                  )}
                  <button className={styles.btnPrimary} onClick={handleSaveProfile}>
                    <Save size={15} /> Save Profile
                  </button>
                </div>
              )}

              <hr className={styles.divider} />

              <h3 className={styles.subHeading}>Change Password</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      className={styles.input}
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      disabled={isAuditor}
                      placeholder="Enter current password"
                    />
                    <button className={styles.eyeBtn} onClick={() => setShowOldPassword(p => !p)}>
                      {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      className={styles.input}
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={isAuditor}
                      placeholder="Enter new password (min 8 chars)"
                    />
                    <button className={styles.eyeBtn} onClick={() => setShowNewPassword(p => !p)}>
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              {!isAuditor && (
                <div className={styles.formActions}>
                  {passwordSaved && (
                    <span className={styles.savedMsg}><CheckCircle size={14} /> Password updated successfully</span>
                  )}
                  <button className={styles.btnSecondary} onClick={handleSavePassword}>
                    <Lock size={15} /> Update Password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── WAREHOUSE CONFIG ─────────────────────────────────────────────── */}
          {activeTab === 'warehouse' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Warehouse Configuration</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Default Warehouse Scope</label>
                  <select
                    className={styles.select}
                    value={defaultWarehouseId}
                    onChange={e => setDefaultWarehouseId(e.target.value)}
                    disabled={isAuditor}
                  >
                    <option value="all">All Warehouses</option>
                    {mockWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Cycle Count Frequency</label>
                  <select
                    className={styles.select}
                    value={cycleCountFrequency}
                    onChange={e => setCycleCountFrequency(e.target.value)}
                    disabled={isAuditor}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Automatic Reorder Triggers</div>
                  <div className={styles.toggleDescription}>Allow AI model to auto-trigger purchase orders when stock falls below reorder point</div>
                </div>
                <button
                  className={`${styles.toggle} ${autoReorderEnabled ? styles.toggleOn : ''}`}
                  onClick={() => !isAuditor && setAutoReorderEnabled(!autoReorderEnabled)}
                  disabled={isAuditor}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>

              <div className={styles.warehouseTable}>
                <h3 className={styles.subHeading}>Facility Overview</h3>
                <Table headers={['Facility', 'Location', 'Type', 'Status', 'Utilization', 'Cold Storage']}>
                  {mockWarehouses.map(wh => (
                    <tr key={wh.id}>
                      <td><strong>{wh.name}</strong><br /><span className={styles.whCode}>{wh.code}</span></td>
                      <td>{wh.location}</td>
                      <td><Badge variant="secondary">{wh.type}</Badge></td>
                      <td>
                        <Badge variant={wh.status === 'Active' ? 'success' : 'warning'}>{wh.status}</Badge>
                      </td>
                      <td>
                        <div className={styles.utilBar}>
                          <div className={styles.utilFill} style={{ width: `${wh.utilization}%` }} />
                          <span>{wh.utilization}%</span>
                        </div>
                      </td>
                      <td>
                        {wh.coldStorageEnabled
                          ? <Badge variant={wh.coldStorageStatus === 'Critical' ? 'danger' : wh.coldStorageStatus === 'Warning' ? 'warning' : 'success'}>{wh.coldStorageStatus}</Badge>
                          : <span className={styles.naText}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>

              {!isAuditor && (
                <div className={styles.formActions}>
                  {warehouseSaved && (
                    <span className={styles.savedMsg}><CheckCircle size={14} /> Warehouse settings saved</span>
                  )}
                  <button className={styles.btnPrimary} onClick={handleSaveWarehouse}>
                    <Save size={15} /> Save Configuration
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ────────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Notification Preferences</h2>
              <p className={styles.panelDescription}>
                Configure which alerts are delivered via email, SMS, and in-app notifications.
              </p>

              <div className={styles.notifTable}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifColAlert}>Alert Type</span>
                  <span className={styles.notifColChannel}>Email</span>
                  <span className={styles.notifColChannel}>SMS</span>
                  <span className={styles.notifColChannel}>In-App</span>
                </div>
                {notifPrefs.map(pref => (
                  <div key={pref.id} className={styles.notifRow}>
                    <div className={styles.notifColAlert}>
                      <div className={styles.notifLabel}>{pref.label}</div>
                      <div className={styles.notifDesc}>{pref.description}</div>
                    </div>
                    {(['email', 'sms', 'inApp'] as const).map(channel => (
                      <div key={channel} className={styles.notifColChannel}>
                        <button
                          className={`${styles.toggle} ${styles.toggleSmall} ${pref[channel] ? styles.toggleOn : ''}`}
                          onClick={() => !isAuditor && toggleNotifPref(pref.id, channel)}
                          disabled={isAuditor}
                        >
                          <span className={styles.toggleKnob} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ─────────────────────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>System Integrations</h2>
              <p className={styles.panelDescription}>
                Manage connections to external ERP, government portals, and device APIs.
              </p>

              <div className={styles.integrationGrid}>
                {integrationList.map(int => (
                  <div key={int.id} className={styles.integrationCard}>
                    <div className={styles.integrationCardHeader}>
                      <div className={styles.integrationIcon}>{int.icon}</div>
                      <Badge variant={int.status === 'Connected' ? 'success' : 'danger'}>{int.status}</Badge>
                    </div>
                    <h3 className={styles.integrationName}>{int.name}</h3>
                    <p className={styles.integrationDesc}>{int.description}</p>
                    <div className={styles.integrationMeta}>
                      <RefreshCw size={12} />
                      <span>Last sync: {testingIntegrationId === int.id ? 'Testing…' : int.lastSync}</span>
                    </div>
                    {!isAuditor && (
                      <div className={styles.integrationActions}>
                        {int.status === 'Connected' ? (
                          <>
                            <button
                              className={styles.btnTestConn}
                              onClick={() => handleTestConnection(int.id)}
                              disabled={testingIntegrationId === int.id}
                            >
                              {testingIntegrationId === int.id ? 'Testing…' : 'Test Connection'}
                            </button>
                            <button className={styles.btnDisconn} onClick={() => handleDisconnect(int.id)}>
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.btnPrimary}
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => handleConnect(int.id)}
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT (Admin only) ─────────────────────────────────── */}
          {activeTab === 'users' && isAdmin && (
            <div className={styles.panel}>
              <div className={styles.panelTitleRow}>
                <h2 className={styles.panelTitle}>User Management</h2>
                <button className={styles.btnPrimary} onClick={() => setIsInviteModalOpen(true)}>
                  + Invite User
                </button>
              </div>
              <p className={styles.panelDescription}>
                Manage user accounts, roles, and access permissions across all facilities.
              </p>

              <div className={styles.tableCard}>
                <Table headers={['User', 'Email', 'Role', 'Warehouse', 'Status']}>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>{u.name.charAt(0)}</div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td><Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge></td>
                      <td>{u.warehouseId ? mockWarehouses.find(w => w.id === u.warehouseId)?.name || u.warehouseId : 'All Facilities'}</td>
                      <td>
                        <Badge variant={u.email.endsWith('@demo.waresphere.io') ? 'info' : 'success'}>
                          {u.email.endsWith('@demo.waresphere.io') ? 'Demo Account' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>

              <div className={styles.userMgmtNote}>
                <AlertTriangle size={14} />
                <span>Role changes take effect immediately. Demo accounts are read-only and cannot be modified.</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => { setIsInviteModalOpen(false); setInviteError('') }}
        title="Invite User"
      >
        <form onSubmit={handleInviteSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input
              className={styles.input}
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Work Email *</label>
            <input
              className={styles.input}
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Role *</label>
            <select
              className={styles.select}
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as UserRole)}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {inviteError && <p className={styles.inviteError}>{inviteError}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => { setIsInviteModalOpen(false); setInviteError('') }}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Send Invite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Settings
