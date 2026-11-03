import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext'
import { RoleProvider } from './contexts/RoleContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { SettingsProvider } from './contexts/SettingsContext'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <ThemeProvider>
          <SettingsProvider>
            <RouterProvider router={router} />
          </SettingsProvider>
        </ThemeProvider>
      </RoleProvider>
    </AuthProvider>
  )
}
