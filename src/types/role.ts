import { UserRole } from '../constants/roles'

export interface RolePermission {
  role: UserRole
  permissions: string[]
}
