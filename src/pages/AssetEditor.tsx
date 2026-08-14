import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Camera, Check, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const [icon, setIcon] = useState('📦')
  const [image, setImage] = useState<string>()
  const [purchaseDate, setPurchaseDate] = useState(today())
  const [purchasePrice, setPurchasePrice] = useState('')
  const [status, setStatus] = useState<AssetStatus>('using')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!current) return
    setName(current.name)
    setCategoryId(current.categoryId)
    setIcon(current.icon)
    setImage(current.image)
    setPurchaseDate(current.purchaseDate)
    setPurchasePrice(String(current.purchasePrice))
    setStatus(current.status)
    setNotes(current.notes ?? '')
  }, [current])

  useEffect(() => {
    const category = categories.find((item) => item.id === categoryId)
    if (!id && category) setIcon(category.icon)
  }, [categories, categoryId, id])

  async function chooseImage(file?: File) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('图片不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

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
      name: name.trim(), categoryId, icon, image, purchaseDate, purchasePrice: price, status,
      favorite: current?.favorite ?? false,
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
        <div className="photo-field">
          <label className={image ? 'photo-preview has-image' : 'photo-preview'}>
            {image ? <img src={image} alt="物品预览" /> : <><span>{icon}</span><small><Camera size={17} />添加照片</small></>}
            <input type="file" accept="image/*" capture="environment" onChange={(event) => void chooseImage(event.target.files?.[0])} />
          </label>
          {image && <button type="button" className="remove-photo" onClick={() => setImage(undefined)}><X size={16} />移除照片</button>}
        </div>

        {error && <div className="error-banner">{error}</div>}
        <label className="field"><span>物品名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：iPhone 17" maxLength={40} /></label>
        <div className="field-grid">
          <label className="field"><span>分类</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</select></label>
          <label className="field"><span>状态</span><select value={status} onChange={(event) => setStatus(event.target.value as AssetStatus)}><option value="using">使用中</option><option value="stored">收藏中</option><option value="retired">已退役</option><option value="sold">已售出</option></select></label>
        </div>
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
