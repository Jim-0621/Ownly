import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { defaultAssetIcon } from '../asset-icons'
import { db } from '../db'
import { money, today, uid } from '../utils'

const priorityMeta = {
  high: { label: '很想要', color: '#ff5d67' },
  medium: { label: '想一想', color: '#ffb020' },
  low: { label: '随缘', color: '#7b8496' },
} as const

export default function Wishlist() {
  const wishes = useLiveQuery(() => db.wishes.orderBy('createdAt').reverse().toArray(), []) ?? []
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? []
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('digital')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || Number(price) < 0) return
    const category = categories.find((item) => item.id === categoryId)
    await db.wishes.add({
      id: uid('wish'), name: name.trim(), categoryId, icon: category?.icon ?? '✨',
      expectedPrice: Number(price) || 0, priority, createdAt: new Date().toISOString(),
    })
    setName('')
    setPrice('')
    setAdding(false)
  }

  async function convert(id: string) {
    const wish = await db.wishes.get(id)
    if (!wish) return
    const now = new Date().toISOString()
    await db.transaction('rw', db.wishes, db.assets, async () => {
      await db.assets.add({
        id: uid('asset'), name: wish.name, categoryId: wish.categoryId, icon: defaultAssetIcon(wish.categoryId),
        purchaseDate: today(), purchasePrice: wish.expectedPrice, status: 'using', favorite: false,
        notes: wish.notes, createdAt: now, updatedAt: now,
      })
      await db.wishes.delete(wish.id)
    })
  }

  return (
    <div className="standard-page wishlist-page">
      <header className="standard-header">
        <div><span className="eyebrow dark">WISHLIST</span><h1>心愿单</h1></div>
        <button className="round-primary" onClick={() => setAdding(true)}><Plus /></button>
      </header>
      <section className="wishlist-summary"><span>为喜欢的东西留一点期待</span><strong>{wishes.length} 个心愿 · {money(wishes.reduce((sum, item) => sum + item.expectedPrice, 0))}</strong></section>

      {adding && <form className="wish-form" onSubmit={submit}>
        <div className="form-title"><h2>添加心愿</h2><button type="button" onClick={() => setAdding(false)}><X /></button></div>
        <label className="field"><span>想要什么</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：降噪耳机" /></label>
        <div className="field-grid">
          <label className="field"><span>预计价格</span><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" /></label>
          <label className="field"><span>分类</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</select></label>
        </div>
        <div className="priority-picker">{(Object.keys(priorityMeta) as Array<keyof typeof priorityMeta>).map((value) => <button type="button" key={value} className={priority === value ? 'active' : ''} onClick={() => setPriority(value)}>{priorityMeta[value].label}</button>)}</div>
        <button className="primary-button wide">保存心愿</button>
      </form>}

      <div className="wish-list">
        {wishes.map((wish) => <article className="wish-card" key={wish.id}>
          <div className="wish-icon">{wish.icon}</div>
          <div className="wish-main"><div><strong>{wish.name}</strong><span style={{ color: priorityMeta[wish.priority].color }}>{priorityMeta[wish.priority].label}</span></div><b>{money(wish.expectedPrice)}</b></div>
          <div className="wish-actions"><button title="转为已购" onClick={() => void convert(wish.id)}><Check /></button><button className="danger-icon" title="删除" onClick={() => void db.wishes.delete(wish.id)}><Trash2 /></button></div>
        </article>)}
        {!wishes.length && <div className="empty-state"><span>✨</span><h3>心愿单还是空的</h3><p>先记录下来，等到合适的时候再带回家。</p><button className="primary-button" onClick={() => setAdding(true)}>添加心愿</button></div>}
      </div>
    </div>
  )
}
