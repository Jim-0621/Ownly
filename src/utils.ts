import type { Asset, AssetStatus } from './types'

export const statusMeta: Record<AssetStatus, { label: string; color: string }> = {
  using: { label: '使用中', color: '#20c997' },
  stored: { label: '收藏中', color: '#ffb020' },
  retired: { label: '已退役', color: '#9098a8' },
  sold: { label: '已售出', color: '#ff5d67' },
}

export function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function daysInclusive(start: string, end = today()) {
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 1
  return Math.max(1, Math.floor((endTime - startTime) / 86_400_000) + 1)
}

export function assetEndDate(asset: Asset) {
  if (asset.status === 'sold' && asset.saleDate) return asset.saleDate
  if (asset.status === 'retired' && asset.retiredDate) return asset.retiredDate
  return today()
}

export function ownedDays(asset: Asset) {
  return daysInclusive(asset.purchaseDate, assetEndDate(asset))
}

export function netCost(asset: Asset) {
  return Math.max(0, asset.purchasePrice - (asset.salePrice ?? 0))
}

export function dailyCost(asset: Asset) {
  return netCost(asset) / ownedDays(asset)
}

export function money(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0)
}

export function shortMoney(value: number) {
  if (value >= 10_000) return `¥${(value / 10_000).toFixed(1)}万`
  return money(value)
}

export function uid(prefix: string) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}
