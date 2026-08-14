import { useRef, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DatabaseBackup, Download, LogOut, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { db, exportData, importData } from '../db'
import { useAuth } from '../auth-context'
import { useCloudSync } from '../sync-context'
import { uid } from '../utils'

const categoryColors = ['#1d82ff', '#7c5cff', '#00a77b', '#ff7a59', '#ffb020', '#7b8496']

export default function Settings() {
  const { user, logout } = useAuth()
  const { status, lastSyncedAt, message: syncMessage, syncNow } = useCloudSync()
  const categories = useLiveQuery(() => db.categories.orderBy('createdAt').toArray(), []) ?? []
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? []
  const fileRef = useRef<HTMLInputElement>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryIcon, setCategoryIcon] = useState('📦')
  const [message, setMessage] = useState('')

  async function addCategory(event: FormEvent) {
    event.preventDefault()
    if (!categoryName.trim()) return
    await db.categories.add({ id: uid('category'), name: categoryName.trim(), icon: categoryIcon || '📦', color: categoryColors[categories.length % categoryColors.length], createdAt: new Date().toISOString() })
    setCategoryName('')
    setCategoryIcon('📦')
  }

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
    if (!window.confirm('确定清空全部资产、分类和心愿单吗？请先导出备份。')) return
    await db.transaction('rw', db.assets, db.categories, db.wishes, async () => {
      await Promise.all([db.assets.clear(), db.categories.clear(), db.wishes.clear()])
    })
    setMessage('本地数据已清空。')
  }

  return (
    <div className="standard-page settings-page">
      <header className="standard-header"><div><span className="eyebrow dark">MY OWNLY</span><h1>我的</h1></div></header>
      <section className="profile-card"><div className="profile-mark">{user?.username.slice(0, 1).toUpperCase()}</div><div><strong>{user?.username} 的云空间</strong><span><ShieldCheck size={15} />{status === 'synced' ? '数据已安全同步到 Cloudflare D1' : status === 'syncing' ? '正在同步到云端' : '本地缓存可继续使用'}</span></div><div className="profile-meta"><b>{assets.length} 件物品</b><button onClick={() => void syncNow()}>立即同步</button></div></section>
      {syncMessage && <div className="sync-warning">{syncMessage}</div>}
      {lastSyncedAt && <p className="last-sync-time">上次同步：{new Date(lastSyncedAt).toLocaleString('zh-CN')}</p>}
      {message && <button className="message-banner" onClick={() => setMessage('')}>{message}</button>}

      <section className="settings-card">
        <div className="settings-title"><div><h2>分类管理</h2><p>用自己的方式整理物品</p></div></div>
        <div className="category-list">{categories.map((category) => <div className="category-row" key={category.id}><span style={{ background: `${category.color}18`, color: category.color }}>{category.icon}</span><strong>{category.name}</strong><small>{assets.filter((asset) => asset.categoryId === category.id).length} 件</small><button disabled={assets.some((asset) => asset.categoryId === category.id)} title="有物品的分类不能删除" onClick={() => void db.categories.delete(category.id)}><Trash2 size={17} /></button></div>)}</div>
        <form className="category-form" onSubmit={addCategory}><input className="emoji-input" value={categoryIcon} onChange={(event) => setCategoryIcon(event.target.value)} maxLength={4} aria-label="分类图标" /><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="新分类名称" /><button><Plus /></button></form>
      </section>

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
