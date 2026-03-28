'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, Button, Icon } from '@/components/ui'
import { Navigation } from '@/components/Navigation'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

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

export default function DashboardPage() {
  const { user, household, setDashboardData, setAIInsights, aiInsights } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      if (!household) return
      
      try {
        const [dashRes, insightsRes] = await Promise.all([
          fetch(`/api/dashboard?householdId=${household.id}`, { credentials: 'include' }),
          fetch(`/api/ai/insights?householdId=${household.id}`, { credentials: 'include' }),
        ])
        
        console.log('Dashboard status:', dashRes.status, insightsRes.status)
        const dashData = await dashRes.json()
        console.log('dashRes:', dashRes.status)
        const insightsData = await insightsRes.json()
        
        console.log('Dashboard API response:', dashData)
        console.log('Household:', household)
        
        if (dashRes.ok) {
          setData(dashData)
        } else {
          console.error('Dashboard API error:', dashData.error)
        }
        if (insightsRes.ok) setAIInsights(insightsData.insights || [])
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboard()
  }, [household, setDashboardData, setAIInsights])

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6366f1', '#14b8a6']

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
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 mb-0.5">Este mes</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.currentMonthTotal.toFixed(2)}€</p>
              <p className={`text-[10px] ${data.summary.monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.summary.monthOverMonthChange > 0 ? '↑' : '↓'} {Math.abs(data.summary.monthOverMonthChange)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 mb-0.5">Pendiente</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.pendingTotal.toFixed(2)}€</p>
              <p className="text-[10px] text-gray-500">{data.summary.pendingCount} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 mb-0.5">Vencidas</p>
              <p className="text-xl font-bold text-red-600">{data.summary.overdueTotal.toFixed(2)}€</p>
              <p className="text-[10px] text-gray-500">{data.summary.overdueCount} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 mb-0.5">Media mensual</p>
              <p className="text-xl font-bold text-gray-900">{data.summary.averageMonthly.toFixed(2)}€</p>
              <p className="text-[10px] text-gray-500">6 meses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-sm">Gastos por categoría</h2>
            </CardHeader>
            <CardContent className="p-2">
              {data.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No hay datos suficientes</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-sm">Evolución mensual</h2>
            </CardHeader>
            <CardContent className="p-2">
              {data.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                    <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No hay datos suficientes</p>
              )}
            </CardContent>
          </Card>
        </div>

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
      <Navigation />
    </div>
  )
}
