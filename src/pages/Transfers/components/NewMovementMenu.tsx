import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import styles from './NewMovementMenu.module.css'

interface NewMovementMenuProps {
  onSelect: (option: string) => void
}

export const NewMovementMenu: React.FC<NewMovementMenuProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const options = [
    'Inter-Warehouse Transfer',
    'Bin-to-Bin Move',
    'Stock Adjustment',
    'Customer Return (RMA)',
    'Supplier Return',
    'Kit Assembly / Disassembly',
    'Material Issue'
  ]

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={menuRef} className={styles.container}>
      <button
        onClick={() => onSelect('Inter-Warehouse Transfer')}
        className={styles.primaryBtn}
      >
        <Plus size={16} />
        <span>New Transfer</span>
      </button>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownToggle}
        aria-label="Toggle menu options"
      >
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onSelect(opt)
                setIsOpen(false)
              }}
              className={styles.menuItem}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
export default NewMovementMenu
