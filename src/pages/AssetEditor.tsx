import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssetIcon, AssetIconPicker, defaultAssetIcon, normalizeAssetIcon } from '../asset-icons'
import { DatePicker } from '../DatePicker'
import { db, getCategories } from '../db'
import { SelectControl } from '../SelectControl'
import type { AssetStatus, Category } from '../types'
import { today, uid } from '../utils'

const EMPTY_CATEGORIES: Category[] = []

export default function AssetEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const categories = useLiveQuery(() => getCategories(), []) ?? EMPTY_CATEGORIES
  const current = useLiveQuery(() => id ? db.assets.get(id) : undefined, [id])
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('digital')
  const [icon, setIcon] = useState(defaultAssetIcon('digital'))
  const [purchaseDate, setPurchaseDate] = useState(today())
  const [purchasePrice, setPurchasePrice] = useState('')
  const [status, setStatus] = useState<AssetStatus>('using')
  const [statusDate, setStatusDate] = useState(today())
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
    setStatusDate(current.status === 'sold' ? current.saleDate ?? today() : current.status === 'retired' ? current.retiredDate ?? today() : today())
    setNotes(current.notes ?? '')
  }, [current])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const price = Number(purchasePrice)
    if (!name.trim()) return setError('请输入物品名称')
    if (!purchaseDate) return setError('请选择购买日期')
    if (!Number.isFinite(price) || price < 0) return setError('请输入正确的购买价格')
    if (status !== 'using' && (!statusDate || statusDate < purchaseDate || statusDate > today())) {
      return setError(`${status === 'sold' ? '售出' : '退役'}日期应在购买日期和今天之间`)
    }

    const now = new Date().toISOString()
    const assetId = current?.id ?? uid('asset')
    await db.assets.put({
      id: assetId,
      name: name.trim(), categoryId, icon: normalizeAssetIcon(icon, categoryId), purchaseDate, purchasePrice: price, status,
      retiredDate: status === 'retired' ? statusDate : undefined,
      saleDate: status === 'sold' ? statusDate : undefined,
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
          <div className="field"><span>分类</span><SelectControl value={categoryId} options={categories.map((item) => ({ value: item.id, label: item.name }))} onChange={(nextCategoryId) => { setCategoryId(nextCategoryId); setIcon(defaultAssetIcon(nextCategoryId)) }} ariaLabel="物品分类" /></div>
          <div className="field"><span>状态</span><SelectControl value={status} options={[{ value: 'using', label: '使用中' }, { value: 'sold', label: '已售出' }, { value: 'retired', label: '已退役' }]} onChange={(value) => { const nextStatus = value as AssetStatus; if (nextStatus !== status && nextStatus !== 'using') setStatusDate(today()); setStatus(nextStatus) }} ariaLabel="物品状态" /></div>
        </div>
        {status !== 'using' && <div className="field status-date-field"><span>{status === 'sold' ? '售出日期' : '退役日期'}</span><DatePicker value={statusDate} min={purchaseDate} max={today()} onChange={setStatusDate} ariaLabel={status === 'sold' ? '售出日期' : '退役日期'} /></div>}
        <AssetIconPicker categoryId={categoryId} value={icon} onChange={setIcon} />
        <div className="field-grid">
          <div className="field"><span>购买日期</span><DatePicker value={purchaseDate} max={today()} onChange={setPurchaseDate} ariaLabel="购买日期" /></div>
          <label className="field"><span>购买价格</span><div className="money-input"><b>¥</b><input inputMode="decimal" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} placeholder="0.00" /></div></label>
        </div>
        <label className="field"><span>备注</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="购买渠道、型号、保修信息……" rows={4} maxLength={500} /></label>
        <button className="primary-button wide" type="submit">保存物品</button>
      </form>
    </div>
  )
}
