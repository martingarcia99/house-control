'use client'

import { useEffect, useState, lazy, Suspense, memo, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useFetchWithCache, createCacheKey } from '@/lib/hooks/useFetchWithCache'
import { Card, CardContent, CardHeader, Icon } from '@/components/ui'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

const DashboardCharts = lazy(() => 
  import('@/components/DashboardCharts').then(m => ({ default: m.DashboardCharts }))
)

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="animate-pulse bg-gray-100 rounded-lg h-[200px]" />
      <div className="animate-pulse bg-gray-100 rounded-lg h-[200px]" />
    </div>
  )
}

interface DashboardData {
  summary: {
    currentMonthTotal: number
    lastMonthTotal: number
    monthOverMonthChange: number
    pendingCount: number
    pendingTotal: number
    overdueCount: number
    overdueTotal: number
    totalSpent: number
    averageMonthly: number
  }
  byCategory: Array<{
    name: string
    amount: number
    change: number
    color: string
  }>
  monthlyTrend: Array<{
    month: string
    amount: number
  }>
}

const SummaryCard = memo(function SummaryCard({ 
  label, 
  value, 
  subtext, 
  subtextClass = 'text-gray-500' 
}: { 
  label: string
  value: string
  subtext: string
  subtextClass?: string
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className={`text-[10px] ${subtextClass}`}>{subtext}</p>
      </CardContent>
    </Card>
  )
})

const DASHBOARD_CACHE_KEY = 'dashboard'

export default function DashboardPage() {
  const { user, household, setAIInsights, aiInsights, setDashboardData, dashboardData } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const fetchingRef = useRef(false)
  const { fetchWithCache, getCachedData, invalidateCache } = useFetchWithCache()

  const fetchDashboard = useCallback(async () => {
    if (!household || fetchingRef.current) return
    fetchingRef.current = true

    const cacheKey = createCacheKey('/api/dashboard', { householdId: household.id })
    const cachedData = getCachedData<DashboardData>(cacheKey)
    const insightsCacheKey = createCacheKey('/api/ai/insights', { householdId: household.id })
    const cachedInsights = getCachedData<{ insights: typeof aiInsights }>(insightsCacheKey)

    if (cachedData) {
      setDashboardData(cachedData)
      if (cachedInsights?.insights) {
        setAIInsights(cachedInsights.insights)
      }
      setLoading(false)
      setHasFetched(true)
      fetchingRef.current = false
      return
    }

    try {
      const [dashRes, insightsRes] = await Promise.all([
        fetchWithCache<DashboardData>(`/api/dashboard?householdId=${household.id}`, { staleTime: 300000 }),
        fetchWithCache<{ insights: typeof aiInsights }>(`/api/ai/insights?householdId=${household.id}`, { staleTime: 300000 }),
      ])
      
      setDashboardData(dashRes)
      if (insightsRes?.insights) setAIInsights(insightsRes.insights)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
      setHasFetched(true)
      fetchingRef.current = false
    }
  }, [household, setAIInsights, setDashboardData, fetchWithCache, getCachedData])

  useEffect(() => {
    if (household && !hasFetched && !fetchingRef.current) {
      fetchDashboard()
    }
  }, [household, hasFetched, fetchDashboard])

  useEffect(() => {
    const handleFocus = () => {
      if (household && hasFetched) {
        fetchDashboard()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [household, hasFetched, fetchDashboard])

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">CasaControl</h1>
              <p className="text-sm text-gray-500 truncate">{household?.name}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-2 md:px-4 py-3">
          <DashboardSkeleton />
        </main>
      </div>
    )
  }

  const changeClass = dashboardData.summary.monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'
  const changeSymbol = dashboardData.summary.monthOverMonthChange > 0 ? '↑' : '↓'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">CasaControl</h1>
            <p className="text-sm text-gray-500 truncate">{household?.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-2 md:px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <SummaryCard 
            label="Este mes" 
            value={`${dashboardData.summary.currentMonthTotal.toFixed(2)}€`}
            subtext={`${changeSymbol} ${Math.abs(dashboardData.summary.monthOverMonthChange)}%`}
            subtextClass={changeClass}
          />
          <SummaryCard 
            label="Pendiente" 
            value={`${dashboardData.summary.pendingTotal.toFixed(2)}€`}
            subtext={`${dashboardData.summary.pendingCount} facturas`}
          />
          <SummaryCard 
            label="Vencidas" 
            value={`${dashboardData.summary.overdueTotal.toFixed(2)}€`}
            subtext={`${dashboardData.summary.overdueCount} facturas`}
            subtextClass="text-red-600"
          />
          <SummaryCard 
            label="Media mensual" 
            value={`${dashboardData.summary.averageMonthly.toFixed(2)}€`}
            subtext="6 meses"
          />
        </div>

        <Suspense fallback={<ChartSkeleton />}>
          <DashboardCharts byCategory={dashboardData.byCategory} monthlyTrend={dashboardData.monthlyTrend} />
        </Suspense>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sparkles" className="text-primary-600" size={20} />
              <h2 className="font-semibold">Insights de IA</h2>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsights.length > 0 ? (
              <div className="space-y-3">
                {aiInsights.slice(0, 5).map((insight, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Icon 
                        name={insight.type === 'ANOMALY' ? 'alert' : insight.type === 'TIP' ? 'lightbulb' : 'sparkles'} 
                        className={insight.type === 'ANOMALY' ? 'text-red-500' : 'text-primary-600'}
                        size={18}
                      />
                      <div>
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-sm text-gray-600">{insight.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Añade facturas para ver insights</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}