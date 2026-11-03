import React, { createContext, useState, ReactNode } from 'react'
import { User } from '../types/user'
import { mockUsers } from '../mock-data/users'
import { UserRole } from '../constants/roles'

interface AuthContextType {
  user: User | null
  users: User[]
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, role: UserRole, companyName: string, password: string) => boolean
  switchUserRole: (role: UserRole) => void
  logout: () => void
  updateProfile: (updates: { name: string; email: string; companyName: string }) => void
  addUser: (user: Omit<User, 'id'>) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null) // Start unauthenticated
  const [usersList, setUsersList] = useState<User[]>(mockUsers)

  const login = (email: string, password: string) => {
    const foundUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      return true
    }
    return false
  }

  const register = (
    name: string,
    email: string,
    role: UserRole,
    companyName: string,
    password: string
  ) => {
    const emailExists = usersList.some(u => u.email.toLowerCase() === email.toLowerCase())
    if (emailExists) return false

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      companyName,
      password
    }
    
    setUsersList(prev => [...prev, newUser])
    setUser(newUser)
    return true
  }

  const switchUserRole = (role: UserRole) => {
    // Find a demo user matching this role
    const demoUser = usersList.find(u => u.role === role && u.email.endsWith('@demo.waresphere.io'))
    if (demoUser) {
      setUser(demoUser)
    } else {
      // Fallback: update active user role directly if not matching a demo account
      setUser(prev => {
        if (!prev) return null
        return { ...prev, role }
      })
    }
  }

  const logout = () => {
    setUser(null)
  }

  // Persists a profile edit (Settings' Profile tab) into both the current
  // user and the shared usersList, so the change is visible everywhere
  // (UserMenu, Settings' own avatar, User Management table) for the rest
  // of the session — not just held in Settings' local component state.
  const updateProfile = (updates: { name: string; email: string; companyName: string }) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev))
    setUsersList(prev => prev.map(u => (u.id === user?.id ? { ...u, ...updates } : u)))
  }

  // Admin-created user (Settings' "+ Invite User"), distinct from
  // self-service `register`: does not log the new user in or require a
  // password from the inviter. Returns false if the email is already used.
  const addUser = (newUser: Omit<User, 'id'>) => {
    const emailExists = usersList.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())
    if (emailExists) return false
    setUsersList(prev => [...prev, { ...newUser, id: `u-${Date.now()}` }])
    return true
  }

  return (
    <AuthContext.Provider
      value={{ user, users: usersList, login, register, switchUserRole, logout, updateProfile, addUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
