import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DatabaseBackup, Download, LogOut, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { db, exportData, importData, resetLocalData } from '../db'
import { useAuth } from '../auth-context'
import { useCloudSync } from '../sync-context'

export default function Settings() {
  const { user, logout } = useAuth()
  const { status, lastSyncedAt, message: syncMessage, syncNow } = useCloudSync()
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? []
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  async function downloadBackup() {
    const blob = new Blob([JSON.stringify(await exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ownly-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('备份已导出，请妥善保存。')
  }

  async function uploadBackup(file?: File) {
    if (!file) return
    try {
      await importData(JSON.parse(await file.text()))
      setMessage('数据已成功恢复。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function clearAll() {
    if (!window.confirm('确定清空全部资产和心愿单吗？请先导出备份。')) return
    await resetLocalData()
    setMessage('数据已清空，默认分类已恢复。')
  }

  return (
    <div className="standard-page settings-page">
      <header className="standard-header"><div><span className="eyebrow dark">MY OWNLY</span><h1>我的</h1></div></header>
      <section className="profile-card"><div className="profile-mark">{user?.username.slice(0, 1).toUpperCase()}</div><div><strong>{user?.username} 的云空间</strong><span><ShieldCheck size={15} />{status === 'synced' ? '数据已安全同步到 Cloudflare D1' : status === 'syncing' ? '正在同步到云端' : '本地缓存可继续使用'}</span></div><div className="profile-meta"><b>{assets.length} 件物品</b><button onClick={() => void syncNow()}>立即同步</button></div></section>
      {syncMessage && <div className="sync-warning">{syncMessage}</div>}
      {lastSyncedAt && <p className="last-sync-time">上次同步：{new Date(lastSyncedAt).toLocaleString('zh-CN')}</p>}
      {message && <button className="message-banner" onClick={() => setMessage('')}>{message}</button>}

      <section className="settings-card data-card">
        <div className="settings-title"><div><h2>数据与备份</h2><p>自动同步到云端，同时保留本地缓存</p></div><DatabaseBackup /></div>
        <button className="settings-action" onClick={() => void downloadBackup()}><span><Download />导出 JSON 备份</span><small>推荐</small></button>
        <button className="settings-action" onClick={() => fileRef.current?.click()}><span><Upload />从备份恢复</span></button>
        <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void uploadBackup(event.target.files?.[0])} />
        <button className="settings-action danger-action" onClick={() => void clearAll()}><span><Trash2 />清空全部数据</span></button>
        <button className="settings-action" onClick={() => void logout()}><span><LogOut />退出当前账号</span></button>
      </section>
      <p className="version-label">Ownly 0.1.0 · 云同步版</p>
    </div>
  )
}
