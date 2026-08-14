import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssetIcon, normalizeAssetIcon } from '../asset-icons'
import { db } from '../db'
import { dailyCost, money, netCost, ownedDays, statusMeta, today } from '../utils'
import { EmptyState } from '../components'

export default function AssetDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const asset = useLiveQuery(async () => (await db.assets.get(id)) ?? null, [id])
  const category = useLiveQuery(() => asset ? db.categories.get(asset.categoryId) : undefined, [asset?.categoryId])

  const chartData = useMemo(() => {
    if (!asset) return []
    const totalDays = ownedDays(asset)
    const points = Array.from({ length: Math.min(7, totalDays) }, (_, index) => {
      const day = Math.max(1, Math.round(1 + (index * (totalDays - 1)) / Math.max(1, Math.min(7, totalDays) - 1)))
      return { day: `第${day}天`, cost: Number((netCost(asset) / day).toFixed(2)) }
    })
    return points
  }, [asset])

  if (asset === undefined) return <div className="loading-state">正在读取物品…</div>
  if (!asset) return <EmptyState title="物品不存在" description="它可能已被删除。" action={<button className="primary-button" onClick={() => navigate('/')}>返回首页</button>} />
  const status = statusMeta[asset.status]

  async function toggleRetired() {
    if (!asset) return
    const retired = asset.status === 'retired'
    await db.assets.update(asset.id, {
      status: retired ? 'using' : 'retired',
      retiredDate: retired ? undefined : today(),
      updatedAt: new Date().toISOString(),
    })
  }

  async function remove() {
    if (!asset) return
    if (!window.confirm(`确定删除“${asset.name}”吗？此操作无法撤销。`)) return
    await db.assets.delete(asset.id)
    navigate('/', { replace: true })
  }

  return (
    <div className="sub-page detail-page">
      <header className="page-header overlay-header">
        <button className="icon-button" onClick={() => navigate(-1)}><ArrowLeft /></button>
        <div className="header-actions">
          <button className="icon-button" onClick={() => navigate(`/assets/${asset.id}/edit`)}><Pencil /></button>
          <button className="icon-button danger-icon" onClick={() => void remove()}><Trash2 /></button>
        </div>
      </header>

      <section className="detail-intro">
        <div className="detail-visual" style={{ color: category?.color, background: category ? `${category.color}12` : undefined }}><AssetIcon name={normalizeAssetIcon(asset.icon, asset.categoryId)} size={72} /></div>
        <h1>{asset.name}</h1>
        <div className="detail-tags">
          <span><i style={{ background: status.color }} />{status.label}</span>
          <span className="blue-tag">{category?.name ?? '未分类'}</span>
          <span className="green-tag">{ownedDays(asset)} 天</span>
        </div>
        <div className="detail-actions">
          <button className="soft-button retire" onClick={() => void toggleRetired()}><RotateCcw />{asset.status === 'retired' ? '重新使用' : '退役'}</button>
        </div>
      </section>

      <section className="detail-card purchase-card">
        <div><span>购买时间</span><strong>{asset.purchaseDate}</strong></div>
        <div><span>购买价格</span><strong>{money(asset.purchasePrice)}</strong></div>
      </section>

      <section className="detail-card chart-card">
        <div className="card-title"><span>当前日均成本</span><strong>{money(dailyCost(asset), 3)}</strong></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1ec96b" stopOpacity={0.35} /><stop offset="100%" stopColor="#1ec96b" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="4 6" stroke="#e5e8ef" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#9098a8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#9098a8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `¥${value}`} />
              <Tooltip formatter={(value) => [money(Number(value)), '日均成本']} />
              <Area type="monotone" dataKey="cost" stroke="#1ec96b" strokeWidth={4} fill="url(#costFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">从购买首日到现在共 {ownedDays(asset)} 天，使用越久，日均成本越低。</p>
      </section>

      {asset.notes && <section className="detail-card notes-card"><span>备注</span><p>{asset.notes}</p></section>}
    </div>
  )
}
