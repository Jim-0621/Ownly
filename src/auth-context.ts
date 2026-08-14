import { createContext, useContext } from 'react'

export interface User {
  id: string
  username: string
}

export interface AuthContextValue {
  user: User | null | undefined
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, registrationCode: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return value
}
