import Dexie, { type EntityTable } from 'dexie'
import { normalizeAssetIcon } from './asset-icons'
import type { Asset, Category, WishItem } from './types'

const databaseStores = {
  assets: 'id, name, categoryId, status, favorite, purchaseDate, createdAt',
  categories: 'id, name, createdAt',
  wishes: 'id, name, categoryId, priority, createdAt',
}

function sanitizeAsset(asset: Asset) {
  const sanitized = { ...asset } as Asset & { image?: unknown }
  delete sanitized.image
  sanitized.icon = normalizeAssetIcon(sanitized.icon, sanitized.categoryId)
  return sanitized
}

function defaultCategories(createdAt = new Date().toISOString()): Category[] {
  return [
    { id: 'digital', name: '数码', icon: '📱', color: '#1d82ff', createdAt },
    { id: 'home', name: '家居', icon: '🏠', color: '#7c5cff', createdAt },
    { id: 'appliance', name: '家电', icon: '🧺', color: '#00a77b', createdAt },
    { id: 'clothing', name: '服饰', icon: '👕', color: '#ff7a59', createdAt },
    { id: 'other', name: '其他', icon: '📦', color: '#7b8496', createdAt },
  ]
}

class OwnlyDatabase extends Dexie {
  assets!: EntityTable<Asset, 'id'>
  categories!: EntityTable<Category, 'id'>
  wishes!: EntityTable<WishItem, 'id'>

  constructor() {
    super('ownly-database')
    this.version(1).stores(databaseStores)
    this.version(2).stores(databaseStores).upgrade((transaction) => (
      transaction.table('assets').toCollection().modify((asset: Asset & { image?: unknown }) => {
        delete asset.image
        asset.icon = normalizeAssetIcon(asset.icon, asset.categoryId)
      })
    ))

    this.on('populate', () => {
      void this.categories.bulkAdd(defaultCategories())
    })
  }
}

export const db = new OwnlyDatabase()

export async function resetLocalData() {
  await db.transaction('rw', db.categories, db.assets, db.wishes, async () => {
    await Promise.all([db.categories.clear(), db.assets.clear(), db.wishes.clear()])
    await db.categories.bulkAdd(defaultCategories())
  })
}

export async function exportData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: await db.categories.toArray(),
    assets: (await db.assets.toArray()).map(sanitizeAsset),
    wishes: await db.wishes.toArray(),
  }
}

export async function importData(value: unknown) {
  const data = value as {
    categories?: Category[]
    assets?: Asset[]
    wishes?: WishItem[]
  }
  if (!Array.isArray(data.categories) || !Array.isArray(data.assets) || !Array.isArray(data.wishes)) {
    throw new Error('备份文件格式不正确')
  }
  const categories = data.categories
  const assets = data.assets.map(sanitizeAsset)
  const wishes = data.wishes

  await db.transaction('rw', db.categories, db.assets, db.wishes, async () => {
    await Promise.all([db.categories.clear(), db.assets.clear(), db.wishes.clear()])
    await db.categories.bulkAdd(categories)
    await db.assets.bulkAdd(assets)
    await db.wishes.bulkAdd(wishes)
  })
}
