import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '../constants/roles'
import { useAuth } from '../hooks/useAuth'

interface RoleContextType {
  activeRole: UserRole
  setRole: (role: UserRole) => void
}

export const RoleContext = createContext<RoleContextType | undefined>(undefined)

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [activeRole, setRole] = useState<UserRole>('Warehouse Manager')

  useEffect(() => {
    if (user && user.role) {
      setRole(user.role)
    }
  }, [user])

  return (
    <RoleContext.Provider value={{ activeRole, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}
