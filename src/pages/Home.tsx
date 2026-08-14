import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AssetCard, EmptyState } from '../components'
import { db } from '../db'
import type { Asset, Category } from '../types'
import { dailyCost, money } from '../utils'

type Filter = 'all' | 'using' | 'stored' | 'favorite'
type Sort = 'recent' | 'value' | 'daily'
const EMPTY_ASSETS: Asset[] = []
const EMPTY_CATEGORIES: Category[] = []

export default function Home() {
  const navigate = useNavigate()
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? EMPTY_ASSETS
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? EMPTY_CATEGORIES
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const visibleAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      if (filter === 'favorite') return asset.favorite
      if (filter !== 'all' && asset.status !== filter) return false
      return asset.name.toLowerCase().includes(query.trim().toLowerCase())
    })
    return filtered.sort((a, b) => {
      if (sort === 'value') return b.purchasePrice - a.purchasePrice
      if (sort === 'daily') return dailyCost(b) - dailyCost(a)
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [assets, filter, query, sort])

  const totalAsset = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + item.purchasePrice, 0)
  const totalDaily = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + dailyCost(item), 0)
  const categoryMap = new Map(categories.map((category) => [category.id, category]))

  function cycleSort() {
    setSort((current) => current === 'recent' ? 'value' : current === 'value' ? 'daily' : 'recent')
  }

  return (
    <div className="home-page">
      <section className="hero-card">
        <div className="hero-topline">
          <div><span className="eyebrow">OWNLY</span><h1>我的好物</h1></div>
          <div className="hero-actions">
            <button className="glass-button" onClick={() => setSearchOpen((value) => !value)} aria-label="搜索">
              {searchOpen ? <X /> : <Search />}
            </button>
            <button className="glass-button add-button" onClick={() => navigate('/assets/new')}><Plus />添加</button>
          </div>
        </div>
        {searchOpen && (
          <div className="hero-search"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索我的物品" /></div>
        )}
        <div className="hero-metrics">
          <div><span>总资产</span><strong>{money(totalAsset)}</strong></div>
          <div><span>总日均</span><strong>{money(totalDaily)}</strong></div>
        </div>
      </section>

      <section className="filter-row" aria-label="资产筛选">
        {([['all', '全部'], ['using', '使用中'], ['stored', '收藏中'], ['favorite', '已收藏']] as const).map(([value, label]) => (
          <button key={value} className={filter === value ? 'filter-pill active' : 'filter-pill'} onClick={() => setFilter(value)}>{label}</button>
        ))}
        <button className="filter-pill sort-button" onClick={cycleSort} title={`当前排序：${sort}`}><ArrowDownUp size={19} /></button>
      </section>

      <div className="asset-list">
        {visibleAssets.map((asset) => <AssetCard key={asset.id} asset={asset} category={categoryMap.get(asset.categoryId)} />)}
        {!visibleAssets.length && (
          <EmptyState title="还没有符合条件的物品" description="记录第一件好物，看看它陪伴了你多少天。" action={<button className="primary-button" onClick={() => navigate('/assets/new')}>添加物品</button>} />
        )}
      </div>
    </div>
  )
}
