import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue, type User } from './auth-context'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error ?? '服务器请求失败')
  return body as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    void api<{ user: User | null }>('/api/me')
      .then((value) => { if (active) setUser(value.user) })
      .catch(() => { if (active) setUser(null) })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    async login(username, password) {
      const result = await api<{ user: User }>('/api/login', {
        method: 'POST', body: JSON.stringify({ username, password }),
      })
      setUser(result.user)
    },
    async register(username, password, registrationCode) {
      const result = await api<{ user: User }>('/api/register', {
        method: 'POST', body: JSON.stringify({ username, password, registrationCode }),
      })
      setUser(result.user)
    },
    async logout() {
      await api('/api/logout', { method: 'POST', body: '{}' })
      setUser(null)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
