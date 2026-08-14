export type AssetStatus = 'using' | 'stored' | 'retired' | 'sold'

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
  image?: string
  purchaseDate: string
  purchasePrice: number
  status: AssetStatus
  favorite: boolean
  retiredDate?: string
  saleDate?: string
  salePrice?: number
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
