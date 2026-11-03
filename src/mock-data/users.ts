import { User } from '../types/user'

export const mockUsers: User[] = [
  // Scaffold mock accounts
  { id: 'u-1', name: 'Nitin Kumar', email: 'nitin@waresphere.in', role: 'Warehouse Manager', warehouseId: 'wh-mum', companyName: 'WareSphere India Ltd', password: 'password123' },
  { id: 'u-2', name: 'Harish Rao', email: 'harish@waresphere.in', role: 'Warehouse Staff', warehouseId: 'wh-mum', companyName: 'WareSphere India Ltd', password: 'password123' },
  { id: 'u-3', name: 'Devendra Gowda', email: 'devendra@waresphere.in', role: 'Operations Director', companyName: 'WareSphere India Ltd', password: 'password123' },

  // Seeded Demo Accounts (1 per RBAC role)
  { id: 'd-staff', name: 'Amit Kumar', email: 'staff@demo.waresphere.io', role: 'Warehouse Staff', warehouseId: 'wh-mum', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-supervisor', name: 'Ranjit Singh', email: 'supervisor@demo.waresphere.io', role: 'Warehouse Supervisor', warehouseId: 'wh-mum', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-manager', name: 'Sanjay Dutt', email: 'manager@demo.waresphere.io', role: 'Warehouse Manager', warehouseId: 'wh-mum', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-ops', name: 'Divya Rao', email: 'ops.director@demo.waresphere.io', role: 'Operations Director', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-quality', name: 'Kiran Patel', email: 'quality@demo.waresphere.io', role: 'Quality Inspector', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-finance', name: 'Manoj Bajpayee', email: 'finance@demo.waresphere.io', role: 'Finance/Compliance', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-it', name: 'Aditya Birla', email: 'it.admin@demo.waresphere.io', role: 'IT Admin', companyName: 'Demo Logistics Ltd', password: 'Demo@123' },
  { id: 'd-auditor', name: 'Prakash Raj', email: 'auditor@demo.waresphere.io', role: 'External Auditor', companyName: 'Demo Logistics Ltd', password: 'Demo@123' }
]
