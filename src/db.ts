import Dexie, { type EntityTable } from 'dexie'
import type { Asset, Category, WishItem } from './types'

class OwnlyDatabase extends Dexie {
  assets!: EntityTable<Asset, 'id'>
  categories!: EntityTable<Category, 'id'>
  wishes!: EntityTable<WishItem, 'id'>

  constructor() {
    super('ownly-database')
    this.version(1).stores({
      assets: 'id, name, categoryId, status, favorite, purchaseDate, createdAt',
      categories: 'id, name, createdAt',
      wishes: 'id, name, categoryId, priority, createdAt',
    })

    this.on('populate', () => {
      const createdAt = new Date().toISOString()
      void this.categories.bulkAdd([
        { id: 'digital', name: '数码', icon: '📱', color: '#1d82ff', createdAt },
        { id: 'home', name: '家居', icon: '🏠', color: '#7c5cff', createdAt },
        { id: 'appliance', name: '家电', icon: '🧺', color: '#00a77b', createdAt },
        { id: 'clothing', name: '服饰', icon: '👕', color: '#ff7a59', createdAt },
        { id: 'other', name: '其他', icon: '📦', color: '#7b8496', createdAt },
      ])
      void this.assets.bulkAdd([
        {
          id: 'demo-phone', name: 'iPhone 17', categoryId: 'digital', icon: '📱',
          purchaseDate: '2026-04-19', purchasePrice: 5099, status: 'using', favorite: true,
          notes: '演示资产，可编辑或删除。', createdAt, updatedAt: createdAt,
        },
        {
          id: 'demo-fridge', name: '冰箱', categoryId: 'appliance', icon: '🧊',
          purchaseDate: '2025-11-18', purchasePrice: 632.7, status: 'using', favorite: false,
          createdAt, updatedAt: createdAt,
        },
        {
          id: 'demo-washer', name: '洗衣机', categoryId: 'appliance', icon: '🧺',
          purchaseDate: '2025-10-07', purchasePrice: 491.8, status: 'using', favorite: false,
          createdAt, updatedAt: createdAt,
        },
      ])
      void this.wishes.add({
        id: 'demo-wish', name: '降噪耳机', categoryId: 'digital', icon: '🎧',
        expectedPrice: 1999, priority: 'medium', notes: '价格合适时入手', createdAt,
      })
    })
  }
}

export const db = new OwnlyDatabase()

export async function exportData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: await db.categories.toArray(),
    assets: await db.assets.toArray(),
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
  const assets = data.assets
  const wishes = data.wishes

  await db.transaction('rw', db.categories, db.assets, db.wishes, async () => {
    await Promise.all([db.categories.clear(), db.assets.clear(), db.wishes.clear()])
    await db.categories.bulkAdd(categories)
    await db.assets.bulkAdd(assets)
    await db.wishes.bulkAdd(wishes)
  })
}
