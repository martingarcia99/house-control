import { create } from 'zustand'
import type { User, Household, Bill, Category, DashboardData, AIInsight, ChatMessage } from '@/types'

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
  
  setUser: (user: User | null) => void
  setHousehold: (household: Household | null) => void
  setHouseholds: (households: Household[]) => void
  setBills: (bills: Bill[]) => void
  addBill: (bill: Bill) => void
  updateBill: (bill: Bill) => void
  removeBill: (id: string) => void
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  setDashboardData: (data: DashboardData | null) => void
  setAIInsights: (insights: AIInsight[]) => void
  addAIInsight: (insight: AIInsight) => void
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
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

  setUser: (user) => set({ user }),
  setHousehold: (household) => set({ household }),
  setHouseholds: (households) => set({ households }),
  setBills: (bills) => set({ bills }),
  addBill: (bill) => set((state) => ({ bills: [bill, ...state.bills] })),
  updateBill: (bill) => set((state) => ({
    bills: state.bills.map((b) => (b.id === bill.id ? bill : b)),
  })),
  removeBill: (id) => set((state) => ({
    bills: state.bills.filter((b) => b.id !== id),
  })),
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  setDashboardData: (data) => set({ dashboardData: data }),
  setAIInsights: (insights) => set({ aiInsights: insights }),
  addAIInsight: (insight) => set((state) => ({ aiInsights: [insight, ...state.aiInsights] })),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages, message] 
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
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
  }),
}))
