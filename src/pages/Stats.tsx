import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db'
import { dailyCost, money, today } from '../utils'
import type { Asset, Category } from '../types'

type Range = 'week' | 'month' | 'year' | 'all'
const EMPTY_ASSETS: Asset[] = []
const EMPTY_CATEGORIES: Category[] = []

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function rangeStart(range: Range) {
  if (range === 'all') return '0000-01-01'
  const date = new Date(`${today()}T00:00:00`)
  date.setDate(date.getDate() - ({ week: 6, month: 29, year: 364 }[range]))
  return dateKey(date)
}

function trendData(assets: Asset[], range: Range) {
  const end = new Date(`${today()}T00:00:00`).getTime()
  const first = range === 'all' && assets.length
    ? Math.min(...assets.map((asset) => new Date(`${asset.purchaseDate}T00:00:00`).getTime()), end)
    : range === 'all' ? end - 6 * 86_400_000 : new Date(`${rangeStart(range)}T00:00:00`).getTime()
  return Array.from({ length: 7 }, (_, index) => {
    const timestamp = first + ((end - first) * index) / 6
    const date = new Date(timestamp)
    const key = dateKey(date)
    const active = assets.filter((asset) => asset.purchaseDate <= key)
    const cost = active.reduce((sum, asset) => {
      const days = Math.max(1, Math.floor((timestamp - new Date(`${asset.purchaseDate}T00:00:00`).getTime()) / 86_400_000) + 1)
      return sum + asset.purchasePrice / days
    }, 0)
    return { date: `${date.getMonth() + 1}/${date.getDate()}`, cost: Number(cost.toFixed(2)) }
  })
}

export default function Stats() {
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? EMPTY_ASSETS
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? EMPTY_CATEGORIES
  const [range, setRange] = useState<Range>('all')
  const periodAssets = assets.filter((asset) => asset.purchaseDate >= rangeStart(range))
  const purchases = periodAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0)
  const sold = periodAssets.filter((asset) => asset.status === 'sold')
  const sales = sold.reduce((sum, asset) => sum + (asset.salePrice ?? 0), 0)
  const totalDaily = assets.reduce((sum, asset) => sum + dailyCost(asset), 0)
  const trend = useMemo(() => trendData(assets, range), [assets, range])
  const categoryData = categories.map((category) => ({
    name: category.name,
    value: assets.filter((asset) => asset.categoryId === category.id).reduce((sum, asset) => sum + asset.purchasePrice, 0),
    color: category.color,
  })).filter((item) => item.value > 0)

  return (
    <div className="standard-page stats-page">
      <header className="standard-header"><div><span className="eyebrow dark">INSIGHTS</span><h1>统计</h1></div></header>
      <div className="segmented-control">
        {([['week', '周'], ['month', '月'], ['year', '年'], ['all', '全部']] as const).map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{label}</button>)}
      </div>

      <section className="stats-card">
        <h2>购入卖出</h2>
        <div className="metric-grid">
          <div><span>购入金额</span><strong>{money(purchases)}</strong></div>
          <div><span>卖出金额</span><strong>{money(sales)}</strong></div>
          <div><span>购入件数</span><strong>{periodAssets.length}</strong></div>
          <div><span>卖出件数</span><strong>{sold.length}</strong></div>
        </div>
      </section>

      <section className="stats-card compact-card">
        <h2>日均总计</h2>
        <div className="metric-grid two">
          <div><span>当前总日均</span><strong>{money(totalDaily)}</strong></div>
          <div><span>单件平均日均</span><strong>{money(assets.length ? totalDaily / assets.length : 0)}</strong></div>
        </div>
      </section>

      <section className="stats-card chart-section">
        <h2>日均趋势</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trend} margin={{ top: 15, right: 8, left: -18, bottom: 0 }}>
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1ec96b" stopOpacity={0.35} /><stop offset="100%" stopColor="#1ec96b" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="4 6" stroke="#e5e8ef" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9098a8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9098a8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `¥${Math.round(value)}`} />
            <Tooltip formatter={(value) => [money(Number(value)), '总日均']} />
            <Area type="monotone" dataKey="cost" stroke="#1ec96b" strokeWidth={4} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {categoryData.length > 0 && <section className="stats-card category-chart"><h2>分类资产</h2><div className="category-chart-content"><ResponsiveContainer width="48%" height={190}><PieChart><Pie data={categoryData} dataKey="value" innerRadius={48} outerRadius={78} paddingAngle={3}>{categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer><div className="legend">{categoryData.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{money(item.value)}</strong></div>)}</div></div></section>}
    </div>
  )
}
