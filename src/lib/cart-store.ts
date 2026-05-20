'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './supabase/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => boolean
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.find((i) => i.id === item.id)) return false
        set((state) => ({ items: [...state.items, item] }))
        return true
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.sale_price, 0),
    }),
    { name: 'cart-storage' }
  )
)
