import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Plus, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AssetCard, EmptyState } from '../components'
import { db } from '../db'
import { SelectControl } from '../SelectControl'
import type { Asset, AssetExpense, Category } from '../types'
import { dailyCost, money, ownedDays } from '../utils'

type ViewMode = 'status' | 'category'
type Sort = 'value' | 'days' | 'daily'
type SortDirection = 'desc' | 'asc'

const EMPTY_ASSETS: Asset[] = []
const EMPTY_EXPENSES: AssetExpense[] = []
const EMPTY_CATEGORIES: Category[] = []
const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'using', label: '使用中' },
  { value: 'sold', label: '已售出' },
  { value: 'retired', label: '已退役' },
]
const sortLabels: Record<Sort, Record<SortDirection, string>> = {
  value: { desc: '金额从高到低', asc: '金额从低到高' },
  days: { desc: '使用天数从长到短', asc: '使用天数从短到长' },
  daily: { desc: '日均从高到低', asc: '日均从低到高' },
}

export default function Home() {
  const navigate = useNavigate()
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? EMPTY_ASSETS
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? EMPTY_EXPENSES
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? EMPTY_CATEGORIES
  const [viewMode, setViewMode] = useState<ViewMode>('status')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<Sort>('value')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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
      let comparison = dailyCost(b, expenses) - dailyCost(a, expenses)
      if (sort === 'value') comparison = b.purchasePrice - a.purchasePrice
      if (sort === 'days') comparison = ownedDays(b) - ownedDays(a)
      return sortDirection === 'desc' ? comparison : -comparison
    })
  }, [assets, expenses, filter, query, sort, sortDirection, viewMode])

  const totalAsset = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + item.purchasePrice, 0)
  const totalDaily = assets.filter((item) => item.status !== 'sold').reduce((sum, item) => sum + dailyCost(item, expenses), 0)
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const filterOptions = viewMode === 'status'
    ? statusFilters
    : [{ value: 'all', label: '全部' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]
  const sortOptions = (Object.keys(sortLabels) as Sort[]).map((value) => ({
    value,
    label: sortLabels[value][value === sort ? sortDirection : 'desc'],
  }))

  function changeViewMode(nextMode: ViewMode) {
    setViewMode(nextMode)
    setFilter('all')
  }

  function changeSort(nextSort: Sort) {
    if (nextSort === sort) {
      setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')
      return
    }
    setSort(nextSort)
    setSortDirection('desc')
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
        <div className="sort-control">
          <ArrowDownUp size={17} />
          <SelectControl value={sort} options={sortOptions} onChange={(value) => changeSort(value as Sort)} ariaLabel="资产排序规则" className="sort-select" />
        </div>
      </section>

      <section className="filter-row" aria-label={viewMode === 'status' ? '按状态筛选' : '按分类筛选'}>
        {filterOptions.map((option) => (
          <button key={option.value} className={filter === option.value ? 'filter-pill active' : 'filter-pill'} onClick={() => setFilter(option.value)}>{option.label}</button>
        ))}
      </section>

      <div className="asset-list">
        {visibleAssets.map((asset) => <AssetCard key={asset.id} asset={asset} category={categoryMap.get(asset.categoryId)} expenses={expenses} />)}
        {!visibleAssets.length && (
          <EmptyState title="还没有符合条件的物品" description="记录第一件好物，看看它陪伴了你多少天。" action={<button className="primary-button" onClick={() => navigate('/assets/new')}>添加物品</button>} />
        )}
      </div>
    </div>
  )
}
