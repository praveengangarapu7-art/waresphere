import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FormField } from '../../components/ui/FormField/FormField'
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput'
import { BrandPanel } from '../../components/ui/BrandPanel/BrandPanel'
import { AuthCard } from '../../components/ui/AuthCard/AuthCard'
import { DemoLoginPanel } from './components/DemoLoginPanel'
import { Modal } from '../../components/ui/Modal/Modal'
import { isValidEmail } from '../../utils/validators'
import { Loader2 } from 'lucide-react'
import styles from './Login.module.css'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDemoFilling, setIsDemoFilling] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrors({})
    setGlobalError(null)

    // Clientside validations
    const nextErrors: { email?: string; password?: string } = {}
    if (!email) {
      nextErrors.email = 'Email address is required'
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      nextErrors.password = 'Password is required'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)

    // Simulate API network latency of ~600ms
    setTimeout(() => {
      const success = login(email, password)
      setLoading(false)
      if (success) {
        navigate('/')
      } else {
        setGlobalError('Invalid email or password. Please try again.')
      }
    }, 600)
  }

  const handleSelectDemo = (demoEmail: string, demoPassword: string) => {
    if (loading) return
    setErrors({})
    setGlobalError(null)
    setIsDemoFilling(true)

    // Simulate autofill typing/timing
    setEmail(demoEmail)
    setPassword(demoPassword)

    // Trigger auto-submit after a brief delay so user sees the text populate
    setTimeout(() => {
      setIsDemoFilling(false)
      setLoading(true)
      // Login execution
      setTimeout(() => {
        const success = login(demoEmail, demoPassword)
        setLoading(false)
        if (success) {
          navigate('/')
        } else {
          setGlobalError('Invalid demo credentials.')
        }
      }, 600)
    }, 350)
  }

  return (
    <div className={styles.container}>
      <div className={styles.formSection}>
        <div className={styles.mobileLogo}>
          <img src="/logo.png" alt="WareSphere" className={styles.logoImg} />
        </div>

        <AuthCard>
          <div className={styles.header}>
            <h2 className={styles.title}>System Sign In</h2>
            <p className={styles.subtitle}>Enter your credentials to access the WMS terminal.</p>
          </div>

          {globalError && (
            <div className={styles.globalErrorBanner} role="alert">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <FormField label="Work Email Address" error={errors.email} required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.in"
                className={`${styles.input} ${isDemoFilling ? styles.autofillGlow : ''}`}
                disabled={loading}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" error={errors.password} required>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={isDemoFilling ? styles.autofillGlow : ''}
                disabled={loading}
                autoComplete="current-password"
              />
            </FormField>

            <div className={styles.formActions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <span>Remember this terminal</span>
              </label>
              <a
                href="#forgot"
                className={styles.forgotLink}
                onClick={(e) => { e.preventDefault(); setIsForgotPasswordOpen(true) }}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  Authenticating...
                </>
              ) : (
                'Sign In to Terminal'
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>Try a demo account</span>
            <span className={styles.dividerLine} />
          </div>

          <DemoLoginPanel onSelectDemo={handleSelectDemo} disabled={loading} />

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with SSO</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.ssoGroup}>
            <button type="button" className={styles.ssoBtn} disabled>
              Google Workspace
            </button>
            <button type="button" className={styles.ssoBtn} disabled>
              Microsoft Entra ID
            </button>
          </div>

          <div className={styles.footer}>
            <span>Don't have a workspace?</span>{' '}
            <Link to="/signup" className={styles.signupLink}>
              Register facility
            </Link>
          </div>
        </AuthCard>
      </div>

      <div className={styles.brandSection}>
        <BrandPanel />
      </div>

      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Forgot Password"
      >
        <p className={styles.forgotModalText}>
          Self-service password reset isn't available in this demo environment.
          Contact your IT administrator to reset your password.
        </p>
      </Modal>
    </div>
  )
}

export default Login
