import { createContext, useContext } from 'react'

export type SyncStatus = 'loading' | 'synced' | 'syncing' | 'offline' | 'error'

export interface SyncContextValue {
  status: SyncStatus
  lastSyncedAt?: string
  message?: string
  syncNow: () => Promise<void>
}

export const SyncContext = createContext<SyncContextValue | null>(null)

export function useCloudSync() {
  const value = useContext(SyncContext)
  if (!value) throw new Error('useCloudSync 必须在 CloudSyncProvider 内使用')
  return value
}
