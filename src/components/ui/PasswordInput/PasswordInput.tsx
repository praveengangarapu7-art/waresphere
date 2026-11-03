import React, { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(prev => !prev)
    }

    return (
      <div className={styles.inputContainer}>
        <input
          type={showPassword ? 'text' : 'password'}
          className={`${styles.input} ${className}`}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={styles.toggleButton}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
