import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AssetCard, EmptyState } from '../components'
import { db } from '../db'
import type { Asset, Category } from '../types'
import { dailyCost, money, ownedDays } from '../utils'

type ViewMode = 'status' | 'category'
type Sort = 'value' | 'days' | 'purchaseDate' | 'daily'

const EMPTY_ASSETS: Asset[] = []
const EMPTY_CATEGORIES: Category[] = []
const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'using', label: '使用中' },
  { value: 'sold', label: '已售出' },
  { value: 'retired', label: '已退役' },
]
const sortOptions: Array<{ value: Sort; label: string }> = [
  { value: 'value', label: '金额从高到低' },
  { value: 'days', label: '使用天数从长到短' },
  { value: 'purchaseDate', label: '购入时间从近到远' },
  { value: 'daily', label: '日均从高到低' },
]

export default function Home() {
  const navigate = useNavigate()
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? EMPTY_ASSETS
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? EMPTY_CATEGORIES
  const [viewMode, setViewMode] = useState<ViewMode>('status')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<Sort>('purchaseDate')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const visibleAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const filtered = assets.filter((asset) => {
      if (filter !== 'all') {
        if (viewMode === 'status' && asset.status !== filter) return false
        if (viewMode === 'category' && asset.categoryId !== filter) return false
      }
      return asset.name.toLowerCase().includes(keyword)
    })
    return filtered.sort((a, b) => {
      if (sort === 'value') return b.purchasePrice - a.purchasePrice
      if (sort === 'days') return ownedDays(b) - ownedDays(a)
      if (sort === 'daily') return dailyCost(b) - dailyCost(a)
      return b.purchaseDate.localeCompare(a.purchaseDate)
    })
  }, [assets, filter, query, sort, viewMode])

  const totalAsset = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + item.purchasePrice, 0)
  const totalDaily = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + dailyCost(item), 0)
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const filterOptions = viewMode === 'status'
    ? statusFilters
    : [{ value: 'all', label: '全部' }, ...categories.map((category) => ({ value: category.id, label: `${category.icon} ${category.name}` }))]

  function changeViewMode(nextMode: ViewMode) {
    setViewMode(nextMode)
    setFilter('all')
  }

  return (
    <div className="home-page">
      <section className={searchOpen ? 'hero-card search-open' : 'hero-card'}>
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

      <section className="home-controls">
        <div className="home-view-toggle" aria-label="首页展示方式">
          <button className={viewMode === 'status' ? 'active' : ''} onClick={() => changeViewMode('status')}>按状态</button>
          <button className={viewMode === 'category' ? 'active' : ''} onClick={() => changeViewMode('category')}>按分类</button>
        </div>
        <label className="sort-control">
          <ArrowDownUp size={17} />
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="资产排序规则">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </section>

      <section className="filter-row" aria-label={viewMode === 'status' ? '按状态筛选' : '按分类筛选'}>
        {filterOptions.map((option) => (
          <button key={option.value} className={filter === option.value ? 'filter-pill active' : 'filter-pill'} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
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
