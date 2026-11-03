import React from 'react'
import styles from './FormField.module.css'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children
}) => {
  return (
    <div className={styles.fieldContainer}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.requiredAsterisk}> *</span>}
      </label>
      <div className={error ? styles.inputWrapperError : styles.inputWrapper}>
        {children}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
}
