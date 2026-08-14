import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssetIcon, AssetIconPicker, defaultAssetIcon, normalizeAssetIcon } from '../asset-icons'
import { db } from '../db'
import type { AssetStatus, Category } from '../types'
import { today, uid } from '../utils'

const EMPTY_CATEGORIES: Category[] = []

export default function AssetEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? EMPTY_CATEGORIES
  const current = useLiveQuery(() => id ? db.assets.get(id) : undefined, [id])
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('digital')
  const [icon, setIcon] = useState(defaultAssetIcon('digital'))
  const [purchaseDate, setPurchaseDate] = useState(today())
  const [purchasePrice, setPurchasePrice] = useState('')
  const [status, setStatus] = useState<AssetStatus>('using')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!current) return
    setName(current.name)
    setCategoryId(current.categoryId)
    setIcon(normalizeAssetIcon(current.icon, current.categoryId))
    setPurchaseDate(current.purchaseDate)
    setPurchasePrice(String(current.purchasePrice))
    setStatus(current.status)
    setNotes(current.notes ?? '')
  }, [current])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const price = Number(purchasePrice)
    if (!name.trim()) return setError('请输入物品名称')
    if (!purchaseDate) return setError('请选择购买日期')
    if (!Number.isFinite(price) || price < 0) return setError('请输入正确的购买价格')

    const now = new Date().toISOString()
    const assetId = current?.id ?? uid('asset')
    await db.assets.put({
      id: assetId,
      name: name.trim(), categoryId, icon: normalizeAssetIcon(icon, categoryId), purchaseDate, purchasePrice: price, status,
      retiredDate: status === 'retired' ? current?.retiredDate ?? today() : undefined,
      saleDate: status === 'sold' ? current?.saleDate ?? today() : undefined,
      salePrice: current?.salePrice,
      notes: notes.trim(), createdAt: current?.createdAt ?? now, updatedAt: now,
    })
    navigate(`/assets/${assetId}`, { replace: true })
  }

  return (
    <div className="sub-page editor-page">
      <header className="page-header">
        <button className="icon-button" onClick={() => navigate(-1)}><ArrowLeft /></button>
        <h1>{id ? '编辑物品' : '添加物品'}</h1>
        <button className="icon-button primary-icon" type="submit" form="asset-form"><Check /></button>
      </header>

      <form id="asset-form" onSubmit={submit} className="form-card">
        {error && <div className="error-banner">{error}</div>}
        <div className="asset-icon-preview"><AssetIcon name={icon} size={58} /><span>当前物品图标</span></div>
        <label className="field"><span>物品名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：iPhone 17" maxLength={40} /></label>
        <div className="field-grid">
          <label className="field"><span>分类</span><select value={categoryId} onChange={(event) => { const nextCategoryId = event.target.value; setCategoryId(nextCategoryId); setIcon(defaultAssetIcon(nextCategoryId)) }}>{categories.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</select></label>
          <label className="field"><span>状态</span><select value={status} onChange={(event) => setStatus(event.target.value as AssetStatus)}><option value="using">使用中</option><option value="sold">已售出</option><option value="retired">已退役</option></select></label>
        </div>
        <AssetIconPicker categoryId={categoryId} value={icon} onChange={setIcon} />
        <div className="field-grid">
          <label className="field"><span>购买日期</span><input type="date" value={purchaseDate} max={today()} onChange={(event) => setPurchaseDate(event.target.value)} /></label>
          <label className="field"><span>购买价格</span><div className="money-input"><b>¥</b><input inputMode="decimal" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} placeholder="0.00" /></div></label>
        </div>
        <label className="field"><span>备注</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="购买渠道、型号、保修信息……" rows={4} maxLength={500} /></label>
        <button className="primary-button wide" type="submit">保存物品</button>
      </form>
    </div>
  )
}
