import React from 'react'
import {
  User,
  ShieldCheck,
  Warehouse,
  TrendingUp,
  ClipboardCheck,
  Scale,
  Settings,
  FileText
} from 'lucide-react'
import styles from './DemoLoginPanel.module.css'

interface DemoLoginPanelProps {
  onSelectDemo: (email: string, password: string) => void
  disabled?: boolean
}

interface DemoRole {
  role: string
  email: string
  icon: React.ReactNode
}

export const DemoLoginPanel: React.FC<DemoLoginPanelProps> = ({ onSelectDemo, disabled }) => {
  const demoRoles: DemoRole[] = [
    {
      role: 'Warehouse Staff',
      email: 'staff@demo.waresphere.io',
      icon: <User size={14} />
    },
    {
      role: 'Warehouse Supervisor',
      email: 'supervisor@demo.waresphere.io',
      icon: <ShieldCheck size={14} />
    },
    {
      role: 'Warehouse Manager',
      email: 'manager@demo.waresphere.io',
      icon: <Warehouse size={14} />
    },
    {
      role: 'Operations Director',
      email: 'ops.director@demo.waresphere.io',
      icon: <TrendingUp size={14} />
    },
    {
      role: 'Quality Inspector',
      email: 'quality@demo.waresphere.io',
      icon: <ClipboardCheck size={14} />
    },
    {
      role: 'Finance/Compliance',
      email: 'finance@demo.waresphere.io',
      icon: <Scale size={14} />
    },
    {
      role: 'IT Admin',
      email: 'it.admin@demo.waresphere.io',
      icon: <Settings size={14} />
    },
    {
      role: 'External Auditor',
      email: 'auditor@demo.waresphere.io',
      icon: <FileText size={14} />
    }
  ]

  return (
    <div className={styles.container}>
      <p className={styles.caption}>Skip the form — explore WareSphere as any role</p>
      <div className={styles.grid}>
        {demoRoles.map(item => (
          <button
            key={item.role}
            type="button"
            className={styles.chip}
            onClick={() => onSelectDemo(item.email, 'Demo@123')}
            disabled={disabled}
          >
            {item.icon}
            <span className={styles.roleName}>{item.role}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
