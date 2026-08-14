import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { exportData, importData, resetLocalData } from './db'
import { useAuth } from './auth-context'
import { SyncContext, type SyncContextValue, type SyncStatus } from './sync-context'

type Snapshot = Awaited<ReturnType<typeof exportData>>

function contentKey(snapshot: Snapshot) {
  return JSON.stringify({
    categories: snapshot.categories,
    assets: snapshot.assets,
    wishes: snapshot.wishes,
  })
}

async function cloudData(method: 'GET' | 'PUT', data?: Snapshot) {
  const response = await fetch('/api/data', {
    method,
    headers: method === 'PUT' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'PUT' ? JSON.stringify({ data }) : undefined,
  })
  const body = await response.json().catch(() => ({})) as {
    data?: Snapshot | null
    updatedAt?: string
    error?: string
  }
  if (!response.ok) throw new Error(body.error ?? '云端同步失败')
  return body
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [lastSyncedAt, setLastSyncedAt] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [ready, setReady] = useState(false)
  const localSnapshot = useLiveQuery(() => exportData(), [])
  const lastContent = useRef('')
  const latestSnapshot = useRef<Snapshot | undefined>(undefined)
  const uploadQueue = useRef(Promise.resolve())

  useEffect(() => {
    latestSnapshot.current = localSnapshot
  }, [localSnapshot])

  useEffect(() => {
    if (!user) return
    let active = true
    setReady(false)
    setStatus('loading')
    setMessage(undefined)
    lastContent.current = ''

    void (async () => {
      try {
        const previousUser = localStorage.getItem('ownly-cloud-user')
        if (previousUser && previousUser !== user.id) await resetLocalData()
        localStorage.setItem('ownly-cloud-user', user.id)

        const local = await exportData()
        const remote = await cloudData('GET')
        if (remote.data) {
          lastContent.current = contentKey(remote.data)
          await importData(remote.data)
        } else {
          await cloudData('PUT', local)
          lastContent.current = contentKey(local)
        }
        if (!active) return
        setLastSyncedAt(remote.updatedAt ?? new Date().toISOString())
        setStatus('synced')
        setReady(true)
      } catch (cause) {
        if (!active) return
        setMessage(cause instanceof Error ? cause.message : '云端同步失败')
        setStatus(navigator.onLine ? 'error' : 'offline')
        setReady(true)
      }
    })()

    return () => { active = false }
  }, [user])

  function enqueueUpload(snapshot: Snapshot) {
    const key = contentKey(snapshot)
    if (key === lastContent.current) return uploadQueue.current
    setStatus('syncing')
    uploadQueue.current = uploadQueue.current.then(async () => {
      try {
        const result = await cloudData('PUT', { ...snapshot, exportedAt: new Date().toISOString() })
        lastContent.current = key
        setLastSyncedAt(result.updatedAt ?? new Date().toISOString())
        setMessage(undefined)
        setStatus('synced')
      } catch (cause) {
        setMessage(cause instanceof Error ? cause.message : '云端同步失败')
        setStatus(navigator.onLine ? 'error' : 'offline')
      }
    })
    return uploadQueue.current
  }

  useEffect(() => {
    if (!ready || !localSnapshot) return
    const timer = window.setTimeout(() => { void enqueueUpload(localSnapshot) }, 700)
    return () => window.clearTimeout(timer)
  }, [localSnapshot, ready])

  useEffect(() => {
    const handleOnline = () => {
      if (latestSnapshot.current) void enqueueUpload(latestSnapshot.current)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  })

  const value = useMemo<SyncContextValue>(() => ({
    status, lastSyncedAt, message,
    async syncNow() {
      const snapshot = await exportData()
      lastContent.current = ''
      await enqueueUpload(snapshot)
    },
  }), [lastSyncedAt, message, status])

  return <SyncContext.Provider value={value}>{status === 'loading' ? <div className="app-loading"><div className="loading-mark">O</div><span>正在同步个人数据…</span></div> : children}</SyncContext.Provider>
}
