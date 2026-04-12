import { create } from 'zustand'
import type { User, Household, Bill, Category, DashboardData, AIInsight, ChatMessage } from '@/types'

interface CacheMetadata {
  timestamp: number
  etag?: string
  hash?: string
}

interface AppState {
  user: User | null
  household: Household | null
  households: Household[]
  bills: Bill[]
  categories: Category[]
  dashboardData: DashboardData | null
  aiInsights: AIInsight[]
  chatMessages: ChatMessage[]
  isLoading: boolean
  error: string | null
  cache: Map<string, { data: unknown; timestamp: number; hash?: string }>
  
  setUser: (user: User | null) => void
  setHousehold: (household: Household | null) => void
  setHouseholds: (households: Household[]) => void
  setBills: (bills: Bill[], skipCache?: boolean) => void
  addBill: (bill: Bill) => void
  updateBill: (bill: Bill) => void
  removeBill: (id: string) => void
  setCategories: (categories: Category[], skipCache?: boolean) => void
  addCategory: (category: Category) => void
  setDashboardData: (data: DashboardData | null, skipCache?: boolean) => void
  setAIInsights: (insights: AIInsight[], skipCache?: boolean) => void
  addAIInsight: (insight: AIInsight) => void
  setChatMessages: (messages: ChatMessage[], skipCache?: boolean) => void
  addChatMessage: (message: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  getCachedData: <T>(key: string) => T | null
  setCacheData: <T>(key: string, data: T) => void
  isCacheValid: (key: string, maxAgeMs?: number) => boolean
  invalidateCache: (key?: string) => void
  
  reset: () => void
}

const hashData = (data: unknown): string => JSON.stringify(data)

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  household: null,
  households: [],
  bills: [],
  categories: [],
  dashboardData: null,
  aiInsights: [],
  chatMessages: [],
  isLoading: false,
  error: null,
  cache: new Map(),

  setUser: (user) => set({ user }),
  setHousehold: (household) => set({ household }),
  setHouseholds: (households) => set({ households }),

  setBills: (bills, skipCache = false) => {
    const state = get()
    if (!skipCache) {
      const key = `bills-${state.household?.id}`
      const newHash = hashData(bills)
      const cached = state.cache.get(key)
      if (cached?.hash === newHash) return
      const newCache = new Map(state.cache)
      newCache.set(key, { data: bills, timestamp: Date.now(), hash: newHash })
      set({ bills, cache: newCache })
    } else {
      set({ bills })
    }
  },

  addBill: (bill) => set((state) => ({ bills: [bill, ...state.bills] })),
  
  updateBill: (bill) => set((state) => ({
    bills: state.bills.map((b) => (b.id === bill.id ? bill : b)),
  })),
  
  removeBill: (id) => set((state) => ({
    bills: state.bills.filter((b) => b.id !== id),
  })),

  setCategories: (categories, skipCache = false) => {
    const state = get()
    if (!skipCache) {
      const key = `categories-${state.household?.id}`
      const newHash = hashData(categories)
      const cached = state.cache.get(key)
      if (cached?.hash === newHash) return
      const newCache = new Map(state.cache)
      newCache.set(key, { data: categories, timestamp: Date.now(), hash: newHash })
      set({ categories, cache: newCache })
    } else {
      set({ categories })
    }
  },

  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),

  setDashboardData: (data, skipCache = false) => {
    const state = get()
    if (!skipCache) {
      const key = `dashboard-${state.household?.id}`
      const newHash = data ? hashData(data) : undefined
      const cached = state.cache.get(key)
      if (cached?.hash === newHash) return
      const newCache = new Map(state.cache)
      newCache.set(key, { data, timestamp: Date.now(), hash: newHash })
      set({ dashboardData: data, cache: newCache })
    } else {
      set({ dashboardData: data })
    }
  },

  setAIInsights: (insights, skipCache = false) => {
    const state = get()
    if (!skipCache) {
      const key = `insights-${state.household?.id}`
      const newHash = hashData(insights)
      const cached = state.cache.get(key)
      if (cached?.hash === newHash) return
      const newCache = new Map(state.cache)
      newCache.set(key, { data: insights, timestamp: Date.now(), hash: newHash })
      set({ aiInsights: insights, cache: newCache })
    } else {
      set({ aiInsights: insights })
    }
  },

  addAIInsight: (insight) => set((state) => ({ aiInsights: [insight, ...state.aiInsights] })),

  setChatMessages: (messages, skipCache = false) => {
    const state = get()
    if (!skipCache) {
      const key = `chat-${state.household?.id}`
      const newHash = hashData(messages)
      const cached = state.cache.get(key)
      if (cached?.hash === newHash) return
      const newCache = new Map(state.cache)
      newCache.set(key, { data: messages, timestamp: Date.now(), hash: newHash })
      set({ chatMessages: messages, cache: newCache })
    } else {
      set({ chatMessages: messages })
    }
  },

  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages, message] 
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getCachedData: <T>(key: string): T | null => {
    const entry = get().cache.get(key)
    return (entry?.data as T) ?? null
  },

  setCacheData: (key, data) => {
    const state = get()
    const newCache = new Map(state.cache)
    newCache.set(key, { data, timestamp: Date.now(), hash: hashData(data) })
    set({ cache: newCache })
  },

  isCacheValid: (key, maxAgeMs = 5 * 60 * 1000) => {
    const entry = get().cache.get(key)
    if (!entry) return false
    return Date.now() - entry.timestamp < maxAgeMs
  },

  invalidateCache: (key) => {
    const state = get()
    const newCache = new Map(state.cache)
    if (key) {
      newCache.delete(key)
    } else {
      newCache.clear()
    }
    set({ cache: newCache })
  },

  reset: () => set({
    user: null,
    household: null,
    households: [],
    bills: [],
    categories: [],
    dashboardData: null,
    aiInsights: [],
    chatMessages: [],
    isLoading: false,
    error: null,
    cache: new Map(),
  }),
}))