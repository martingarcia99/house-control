'use client'

import { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui'

interface CategoryData {
  name: string
  amount: number
  change: number
  color: string
}

interface TrendData {
  month: string
  amount: number
}

interface DashboardChartsProps {
  byCategory: CategoryData[]
  monthlyTrend: TrendData[]
}

const COLORS = ['#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6366f1', '#14b8a6']

export const DashboardCharts = memo(function DashboardCharts({ byCategory, monthlyTrend }: DashboardChartsProps) {
  const chartData = useMemo(() => ({
    byCategory: byCategory.map(c => ({
      name: c.name,
      value: c.amount,
      color: c.color || COLORS[byCategory.indexOf(c) % COLORS.length],
    })),
  }), [byCategory])

  const trendData = useMemo(() => monthlyTrend, [monthlyTrend])

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold text-sm">Gastos por categoría</h2>
        </CardHeader>
        <CardContent className="p-2">
          {chartData.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={30}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
    </>
  )
})

export default DashboardCharts