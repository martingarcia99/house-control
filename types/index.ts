export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  createdAt: Date
}

export interface Household {
  id: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

export interface Category {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  isDefault: boolean
  householdId?: string | null
}

export interface Bill {
  id: string
  amount: number
  description?: string | null
  issueDate: string
  dueDate?: string | null
  categoryId: string
  householdId: string
  paidById: string
  attachmentUrl?: string | null
  notes?: string | null
  createdAt: string
  category: Category
  paidBy: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

export interface DashboardSummary {
  currentMonthTotal: number
  lastMonthTotal: number
  monthOverMonthChange: number
  averageMonthly: number
}

export interface CategoryData {
  name: string
  amount: number
  change: number
  color: string
}

export interface MonthlyData {
  month: string
  amount: number
}

export interface DashboardData {
  summary: DashboardSummary
  byCategory: CategoryData[]
  monthlyTrend: MonthlyData[]
}

export interface AIInsight {
  id?: string
  type: 'ANOMALY' | 'RECOMMENDATION' | 'PREDICTION' | 'PATTERN' | 'TIP'
  title: string
  content: string
  category?: string | null
  metadata?: Record<string, unknown> | null
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: string
}
