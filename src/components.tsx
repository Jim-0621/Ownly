import { BarChart3, Box, Cloud, CloudOff, Heart, LoaderCircle, LogOut, Settings2 } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AssetIcon, normalizeAssetIcon } from './asset-icons'
import { useAuth } from './auth-context'
import { useCloudSync } from './sync-context'
import type { Asset, AssetExpense, Category } from './types'
import { dailyCost, money, netCost, ownedDays, statusMeta } from './utils'

const navItems = [
  { to: '/', label: '首页', icon: Box, end: true },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/wishlist', label: '心愿单', icon: Heart },
  { to: '/settings', label: '我的', icon: Settings2 },
]

export function AppLayout() {
  const isAssetRoute = useLocation().pathname.startsWith('/assets/')
  const { user, logout } = useAuth()
  const { status } = useCloudSync()
  const SyncIcon = status === 'offline' || status === 'error' ? CloudOff : status === 'syncing' || status === 'loading' ? LoaderCircle : Cloud
  const statusText = status === 'synced' ? '云端已同步' : status === 'syncing' ? '正在同步' : status === 'offline' ? '离线使用中' : status === 'error' ? '同步失败' : '正在连接'
  return (
    <div className={isAssetRoute ? 'app-shell asset-route-shell' : 'app-shell'}>
      <main className="page-container"><Outlet /></main>
      <nav className={isAssetRoute ? 'bottom-nav asset-route-nav' : 'bottom-nav'} aria-label="主导航">
        <div className="nav-brand" aria-label="Ownly 个人资产管理">
          <div className="nav-brand-mark">O</div>
          <div><strong>Ownly</strong><span>个人资产管理</span></div>
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Icon size={23} strokeWidth={2.5} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className={`nav-footer sync-${status}`}>
          <div className="nav-user"><span>{user?.username.slice(0, 1).toUpperCase()}</span><div><strong>{user?.username}</strong><small><SyncIcon />{statusText}</small></div></div>
          <button onClick={() => void logout()} title="退出登录"><LogOut /></button>
        </div>
      </nav>
    </div>
  )
}

export function AssetCard({ asset, category, expenses = [] }: { asset: Asset; category?: Category; expenses?: AssetExpense[] }) {
  const status = statusMeta[asset.status]
  return (
    <Link to={`/assets/${asset.id}`} className="asset-card">
      <div className="asset-visual" style={{ color: category?.color, background: category ? `${category.color}12` : undefined }}>
        <AssetIcon name={normalizeAssetIcon(asset.icon, asset.categoryId)} size={35} />
      </div>
      <div className="asset-main">
        <strong>{asset.name}</strong>
        <div className="asset-cost-line">
          <span className="asset-price">{money(netCost(asset, expenses))} ·</span>
          <span className="asset-daily">{money(dailyCost(asset, expenses))}/天</span>
        </div>
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
