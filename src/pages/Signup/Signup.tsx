import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FormField } from '../../components/ui/FormField/FormField'
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput'
import { BrandPanel } from '../../components/ui/BrandPanel/BrandPanel'
import { AuthCard } from '../../components/ui/AuthCard/AuthCard'
import { Modal } from '../../components/ui/Modal/Modal'
import { ROLES } from '../../constants/roles'
import { isValidEmail, getPasswordStrength, PasswordStrength } from '../../utils/validators'
import { Loader2 } from 'lucide-react'
import styles from './Signup.module.css'

export const Signup: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)
  
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    company?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
  }>({})
  const [loading, setLoading] = useState(false)

  const passwordStrength: PasswordStrength = getPasswordStrength(password)

  const getStrengthBarClass = (strength: PasswordStrength) => {
    switch (strength) {
      case 'strong':
        return styles.strengthStrong
      case 'medium':
        return styles.strengthMedium
      default:
        return styles.strengthWeak
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const nextErrors: typeof errors = {}

    if (!name.trim()) nextErrors.name = 'Full name is required'
    if (!email) {
      nextErrors.email = 'Work email is required'
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid work email'
    }
    if (!company.trim()) nextErrors.company = 'Company name is required'
    
    if (!password) {
      nextErrors.password = 'Password is required'
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    if (!agreeTerms) {
      nextErrors.agreeTerms = 'You must agree to the Terms of Service'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)

    // Simulate network latency ~600ms
    setTimeout(() => {
      const success = register(name, email, role, company, password)
      setLoading(false)
      if (success) {
        navigate('/')
      } else {
        setErrors({ email: 'A user with this email address already exists' })
      }
    }, 600)
  }

  return (
    <div className={styles.container}>
      <div className={styles.brandSection}>
        <BrandPanel />
      </div>

      <div className={styles.formSection}>
        <div className={styles.mobileLogo}>
          <img src="/logo.png" alt="WareSphere" className={styles.logoImg} />
        </div>

        <AuthCard>
          <div className={styles.header}>
            <h2 className={styles.title}>Register Workspace</h2>
            <p className={styles.subtitle}>Configure a new facility workspace & admin account.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <FormField label="Full Name" error={errors.name} required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nitin Kumar"
                className={styles.input}
                disabled={loading}
              />
            </FormField>

            <FormField label="Work Email" error={errors.email} required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nitin@company.in"
                className={styles.input}
                disabled={loading}
              />
            </FormField>

            <div className={styles.row}>
              <FormField label="Company Name" error={errors.company} required>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="WareSphere India Ltd"
                  className={styles.input}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Operational Role" required>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={styles.select}
                  disabled={loading}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Create Password" error={errors.password} required>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
              />
              {password && (
                <div className={styles.strengthIndicator}>
                  <div className={styles.strengthTracks}>
                    <div className={`${styles.strengthBar} ${getStrengthBarClass(passwordStrength)}`} />
                  </div>
                  <span className={styles.strengthText}>
                    Password strength: <strong>{passwordStrength}</strong>
                  </span>
                </div>
              )}
            </FormField>

            <FormField label="Confirm Password" error={errors.confirmPassword} required>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={loading}
              />
            </FormField>

            <div className={styles.agreeRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <span className={errors.agreeTerms ? styles.termsTextError : styles.termsText}>
                  I agree to the{' '}
                  <a href="#terms" onClick={(e) => { e.preventDefault(); setLegalModal('terms') }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); setLegalModal('privacy') }}>Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  Provisioning Workspace...
                </>
              ) : (
                'Create WMS Account'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Already have an account?</span>{' '}
            <Link to="/login" className={styles.loginLink}>
              Sign in
            </Link>
          </div>
        </AuthCard>
      </div>

      <Modal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
      >
        <p className={styles.legalModalText}>
          {legalModal === 'terms'
            ? 'This is a demo environment — there is no production Terms of Service to display yet.'
            : 'This is a demo environment — there is no production Privacy Policy to display yet.'}
        </p>
      </Modal>
    </div>
  )
}

export default Signup
