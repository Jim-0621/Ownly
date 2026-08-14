export type AssetStatus = 'using' | 'retired' | 'sold'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface Asset {
  id: string
  name: string
  categoryId: string
  icon: string
  purchaseDate: string
  purchasePrice: number
  status: AssetStatus
  retiredDate?: string
  saleDate?: string
  salePrice?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AssetExpense {
  id: string
  assetId: string
  name: string
  amount: number
  date: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WishItem {
  id: string
  name: string
  categoryId: string
  icon: string
  expectedPrice: number
  priority: 'high' | 'medium' | 'low'
  notes?: string
  createdAt: string
}
