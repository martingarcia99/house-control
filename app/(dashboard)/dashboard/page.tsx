'use client'

import { useEffect, useState, lazy, Suspense, memo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
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

export default function DashboardPage() {
  const { user, household, setAIInsights, aiInsights } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    if (!household) return
    
    try {
      const [dashRes, insightsRes] = await Promise.all([
        fetch(`/api/dashboard?householdId=${household.id}`, { credentials: 'include' }),
        fetch(`/api/ai/insights?householdId=${household.id}`, { credentials: 'include' }),
      ])
      
      const dashData = await dashRes.json()
      const insightsData = await insightsRes.json()
      
      if (dashRes.ok) {
        setData(dashData)
      }
      if (insightsRes.ok) setAIInsights(insightsData.insights || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [household, setAIInsights])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading || !data) {
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

  const changeClass = data.summary.monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'
  const changeSymbol = data.summary.monthOverMonthChange > 0 ? '↑' : '↓'

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
            value={`${data.summary.currentMonthTotal.toFixed(2)}€`}
            subtext={`${changeSymbol} ${Math.abs(data.summary.monthOverMonthChange)}%`}
            subtextClass={changeClass}
          />
          <SummaryCard 
            label="Pendiente" 
            value={`${data.summary.pendingTotal.toFixed(2)}€`}
            subtext={`${data.summary.pendingCount} facturas`}
          />
          <SummaryCard 
            label="Vencidas" 
            value={`${data.summary.overdueTotal.toFixed(2)}€`}
            subtext={`${data.summary.overdueCount} facturas`}
            subtextClass="text-red-600"
          />
          <SummaryCard 
            label="Media mensual" 
            value={`${data.summary.averageMonthly.toFixed(2)}€`}
            subtext="6 meses"
          />
        </div>

        <Suspense fallback={<ChartSkeleton />}>
          <DashboardCharts byCategory={data.byCategory} monthlyTrend={data.monthlyTrend} />
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