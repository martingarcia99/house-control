'use client'

import { useEffect, useState, lazy, Suspense, memo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { useFetchWithCache, createCacheKey } from '@/lib/hooks/useFetchWithCache'
import { toast } from '@/lib/toastStore'
import { Card, CardContent, CardHeader, Icon, Button, IconBadge } from '@/components/ui'
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

interface MemberStats {
  userId: string
  name: string
  avatarUrl: string | null
  role: string
  fairShare: number
  totalPaid: number
  pendingAmount: number
  isPaid: boolean
}

interface MembersData {
  members: MemberStats[]
  summary: {
    totalBills: number
    memberCount: number
    perMember: number
  }
}

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  subtext,
  subtextClass = 'text-gray-500',
  icon,
}: {
  label: string
  value: string
  subtext: string
  subtextClass?: string
  icon: 'dollar' | 'bar-chart'
}) {
  return (
    <Card>
      <CardContent className="p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
            <Icon name={icon} size={13} />
          </span>
          <p className="text-xs text-gray-500 truncate">{label}</p>
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className={`text-[10px] ${subtextClass}`}>{subtext}</p>
      </CardContent>
    </Card>
  )
})

const DASHBOARD_CACHE_KEY = 'dashboard'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function DashboardPage() {
  const { user, household, setAIInsights, aiInsights, setDashboardData, dashboardData } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [membersData, setMembersData] = useState<MembersData | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [payingMemberId, setPayingMemberId] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const { fetchWithCache, getCachedData, invalidateCache } = useFetchWithCache()

  const handlePayMonth = useCallback(async (memberUserId: string) => {
    if (!household || payingMemberId) return
    setPayingMemberId(memberUserId)

    try {
      const res = await fetch('/api/households/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          householdId: household.id,
          month: selectedMonth,
          year: selectedYear
        }),
      })

      if (!res.ok) {
        toast.error('No se pudo registrar el pago')
        return
      }

      const freshRes = await fetch(`/api/households/members?householdId=${household.id}&month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include',
        cache: 'no-store'
      })
      const data = await freshRes.json()

      if (data.members) {
        setMembersData(data as MembersData)
      }
      toast.success('Pago registrado')
    } catch (error) {
      console.error('Error paying month:', error)
      toast.error('No se pudo registrar el pago')
    } finally {
      setPayingMemberId(null)
    }
  }, [household, selectedMonth, selectedYear, payingMemberId, user])

  const fetchDashboard = useCallback(async () => {
    if (!household || fetchingRef.current) return
    fetchingRef.current = true

    const cacheKey = createCacheKey('/api/dashboard', { householdId: household.id, month: selectedMonth.toString(), year: selectedYear.toString() })
    const cachedData = getCachedData<DashboardData>(cacheKey)
    const insightsCacheKey = createCacheKey('/api/ai/insights', { householdId: household.id })
    const cachedInsights = getCachedData<{ insights: typeof aiInsights }>(insightsCacheKey)
    const membersCacheKey = createCacheKey('/api/households/members', { householdId: household.id, month: selectedMonth.toString(), year: selectedYear.toString() })
    const cachedMembers = getCachedData<MembersData>(membersCacheKey)

    if (cachedData) {
      setDashboardData(cachedData)
      if (cachedInsights?.insights) {
        setAIInsights(cachedInsights.insights)
      }
      if (cachedMembers) {
        setMembersData(cachedMembers)
      }
      setLoading(false)
      setHasFetched(true)
      fetchingRef.current = false
      return
    }

    const [dashResult, insightsResult, membersResult] = await Promise.allSettled([
      fetchWithCache<DashboardData>(`/api/dashboard?householdId=${household.id}&month=${selectedMonth}&year=${selectedYear}`, { staleTime: 300000 }),
      fetchWithCache<{ insights: typeof aiInsights }>(`/api/ai/insights?householdId=${household.id}`, { staleTime: 300000 }),
      fetchWithCache<MembersData>(`/api/households/members?householdId=${household.id}&month=${selectedMonth}&year=${selectedYear}`, { staleTime: 60000 }),
    ])

    if (dashResult.status === 'fulfilled') {
      setDashboardData(dashResult.value)
    } else {
      console.error('Error fetching dashboard:', dashResult.reason)
    }

    if (insightsResult.status === 'fulfilled' && insightsResult.value?.insights) {
      setAIInsights(insightsResult.value.insights)
    } else if (insightsResult.status === 'rejected') {
      console.error('Error fetching insights:', insightsResult.reason)
    }

    if (membersResult.status === 'fulfilled' && membersResult.value) {
      setMembersData(membersResult.value)
    } else if (membersResult.status === 'rejected') {
      console.error('Error fetching members:', membersResult.reason)
    }

    setLoading(false)
    setHasFetched(true)
    fetchingRef.current = false
  }, [household, selectedMonth, selectedYear, setAIInsights, setDashboardData, fetchWithCache, getCachedData])

  useEffect(() => {
    if (household && !hasFetched && !fetchingRef.current) {
      fetchDashboard()
    }
  }, [household, hasFetched, fetchDashboard])

  useEffect(() => {
    if (household && hasFetched) {
      setLoading(true)
      fetchDashboard()
    }
  }, [selectedMonth, selectedYear])

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
            <div className="flex items-center gap-2.5 min-w-0">
              <IconBadge name="home" size="sm" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">CasaControl</h1>
                <p className="text-sm text-gray-500 truncate">{household?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
                </div>
              )}
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
          <div className="flex items-center gap-2.5 min-w-0">
            <IconBadge name="home" size="sm" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">CasaControl</h1>
              <p className="text-sm text-gray-500 truncate">{household?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium">{user?.name?.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-2 md:px-4 py-3">
        <div className="flex items-center justify-between mb-4 bg-white rounded-2xl shadow-sm shadow-gray-200/60 border border-gray-100/80 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (selectedMonth === 1) {
                  setSelectedMonth(12)
                  setSelectedYear(selectedYear - 1)
                } else {
                  setSelectedMonth(selectedMonth - 1)
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <span className="text-sm font-semibold min-w-[130px] text-center capitalize">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={() => {
                const now = new Date()
                if (selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth() + 1)) {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1)
                    setSelectedYear(selectedYear + 1)
                  } else {
                    setSelectedMonth(selectedMonth + 1)
                  }
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedMonth(new Date().getMonth() + 1)
              setSelectedYear(new Date().getFullYear())
            }}
            className="text-xs font-medium text-primary-600 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
          <SummaryCard
            label="Este mes"
            value={`${dashboardData.summary.currentMonthTotal.toFixed(2)}€`}
            subtext={`${changeSymbol} ${Math.abs(dashboardData.summary.monthOverMonthChange)}%`}
            subtextClass={changeClass}
            icon="dollar"
          />
          <SummaryCard
            label="Media mensual"
            value={`${dashboardData.summary.averageMonthly.toFixed(2)}€`}
            subtext="histórico"
            icon="bar-chart"
          />
        </div>

        {membersData && membersData.members.length > 1 && (
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Icon name="users" size={18} className="text-primary-600" />
                <h2 className="font-semibold text-sm">Gastos por miembro</h2>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{membersData.summary.totalBills.toFixed(2)}€</p>
                <p className="text-xs text-gray-500">{membersData.summary.perMember.toFixed(2)}€ / persona</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {membersData.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      {member.avatarUrl ? (
                        <Image src={member.avatarUrl} alt={member.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 text-sm font-medium">{member.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500">
                          {member.role === 'OWNER' ? 'Propietario' : member.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold">{member.fairShare.toFixed(2)}€</p>
                        {member.pendingAmount > 0 ? (
                          <p className="text-xs text-yellow-600">{member.pendingAmount.toFixed(2)}€ pendiente</p>
                        ) : member.fairShare > 0 ? (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Icon name="check" size={12} /> Pagado
                          </p>
                        ) : null}
                      </div>
                      {member.userId === user?.id && !member.isPaid && member.fairShare > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePayMonth(member.userId)}
                          disabled={payingMemberId !== null}
                        >
                          {payingMemberId ? 'Pagando...' : 'Pagar'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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