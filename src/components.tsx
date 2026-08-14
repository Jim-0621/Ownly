import { BarChart3, Box, Heart, Settings2 } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import type { Asset, Category } from './types'
import { dailyCost, money, ownedDays, statusMeta } from './utils'

const navItems = [
  { to: '/', label: '首页', icon: Box, end: true },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/wishlist', label: '心愿单', icon: Heart },
  { to: '/settings', label: '我的', icon: Settings2 },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="page-container"><Outlet /></main>
      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Icon size={23} strokeWidth={2.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function AssetCard({ asset, category }: { asset: Asset; category?: Category }) {
  const status = statusMeta[asset.status]
  return (
    <Link to={`/assets/${asset.id}`} className="asset-card">
      <div className="asset-visual">
        {asset.image ? <img src={asset.image} alt="" /> : <span>{asset.icon || category?.icon || '📦'}</span>}
      </div>
      <div className="asset-main">
        <strong>{asset.name}</strong>
        <span>{money(asset.purchasePrice)} · {money(dailyCost(asset))}/天</span>
      </div>
      <div className="asset-days">
        <strong>{ownedDays(asset)}</strong><span>天</span>
        <small><i style={{ background: status.color }} />{status.label}</small>
      </div>
    </Link>
  )
}

export function EmptyState({ icon = '📦', title, description, action }: {
  icon?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
