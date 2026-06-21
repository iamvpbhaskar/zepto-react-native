'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  ShoppingBag, Users, TrendingUp, Package,
  ArrowUpRight, IndianRupee, Clock
} from 'lucide-react'
import { formatCurrency } from '@zepto/utils'

interface Stats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  activeProducts: number
  todayOrders: number
  todayRevenue: number
}

// Mock chart data (replace with real API data in production)
const revenueData = [
  { day: 'Mon', revenue: 4200 },
  { day: 'Tue', revenue: 6800 },
  { day: 'Wed', revenue: 5200 },
  { day: 'Thu', revenue: 8900 },
  { day: 'Fri', revenue: 11200 },
  { day: 'Sat', revenue: 14500 },
  { day: 'Sun', revenue: 9800 },
]

function StatCard({
  title, value, sub, icon: Icon, color, trend
}: {
  title: string
  value: string
  sub?: string
  icon: any
  color: string
  trend?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          <ArrowUpRight size={14} className="text-green-500" />
          <span className="text-xs font-medium text-green-600">{trend}</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data.data))
      .catch(() => {
        // Show mock data if API not connected
        setStats({
          totalOrders: 1247,
          totalRevenue: 285430,
          totalUsers: 842,
          activeProducts: 30,
          todayOrders: 43,
          todayRevenue: 9820,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 h-32 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Your platform performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          sub={`Today: ${formatCurrency(stats?.todayRevenue ?? 0)}`}
          icon={IndianRupee}
          color="bg-green-500"
          trend="+12.5% vs last week"
        />
        <StatCard
          title="Total Orders"
          value={(stats?.totalOrders ?? 0).toLocaleString()}
          sub={`Today: ${stats?.todayOrders ?? 0} orders`}
          icon={ShoppingBag}
          color="bg-blue-500"
          trend="+8.2% vs yesterday"
        />
        <StatCard
          title="Total Customers"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          color="bg-purple-500"
          trend="+23 new today"
        />
        <StatCard
          title="Active Products"
          value={(stats?.activeProducts ?? 0).toString()}
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={TrendingUp}
          color="bg-pink-500"
        />
        <StatCard
          title="Avg Delivery"
          value="9.2 min"
          sub="Target: 10 min"
          icon={Clock}
          color="bg-teal-500"
          trend="On track"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
            <p className="text-sm text-gray-400">Last 7 days performance</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full">
            This Week
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Revenue']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5}
              fill="url(#revenueGrad)" dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
