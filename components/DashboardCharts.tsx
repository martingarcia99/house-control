'use client'

import { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
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

// Validated categorical palette (dataviz skill, fixed order — CVD-safe, light mode).
// Only used as a fallback when a category has no color of its own; real categories
// keep their assigned color so the same category reads identically everywhere in the app.
const FALLBACK_COLORS = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948']

const CHART_MUTED = '#898781'
const CHART_GRID = '#e1e0d9'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 16px rgba(17, 24, 39, 0.08)',
  fontSize: 12,
  padding: '8px 12px',
}

interface LegendEntry {
  value?: React.ReactNode
  color?: string
}

function renderLegend(props: { payload?: LegendEntry[] }) {
  const { payload } = props
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2 px-2">
      {payload.map((entry, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  )
}

export const DashboardCharts = memo(function DashboardCharts({ byCategory, monthlyTrend }: DashboardChartsProps) {
  const chartData = useMemo(() => ({
    byCategory: byCategory.map((c, i) => ({
      name: c.name,
      value: c.amount,
      color: c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
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
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData.byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={64}
                  innerRadius={36}
                  paddingAngle={2}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} contentStyle={tooltipStyle} />
                <Legend content={renderLegend} />
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: CHART_MUTED }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: CHART_MUTED }} width={40} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37, 106, 191, 0.06)' }} />
                <Bar dataKey="amount" name="Gasto" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={24} />
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