export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 6) {
    return 'weak'
  }
  
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  if (score >= 3) {
    return 'strong'
  } else if (score >= 1) {
    return 'medium'
  }
  return 'weak'
}
