'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Database, Table2, ArrowUpRight, RefreshCw, ExternalLink,
  Key, Link2, Hash, Calendar, ToggleRight, FileText, Info
} from 'lucide-react'

interface TableStat {
  name: string
  displayName: string
  icon: string
  color: string
  count: number | null
  fields: number
  relations: string[]
  description: string
}

const TABLE_META: Omit<TableStat, 'count'>[] = [
  {
    name: 'users', displayName: 'Users', icon: '👤', color: '#6366f1',
    fields: 10, relations: ['addresses', 'orders', 'carts', 'wallets', 'notifications', 'recently_viewed'],
    description: 'App customers with phone/email auth'
  },
  {
    name: 'addresses', displayName: 'Addresses', icon: '📍', color: '#10b981',
    fields: 15, relations: ['users', 'orders'],
    description: 'Delivery addresses per user'
  },
  {
    name: 'categories', displayName: 'Categories', icon: '🗂️', color: '#f59e0b',
    fields: 8, relations: ['products'],
    description: 'Product category hierarchy'
  },
  {
    name: 'products', displayName: 'Products', icon: '📦', color: '#ec4899',
    fields: 16, relations: ['categories', 'cart_items', 'order_items', 'recently_viewed'],
    description: 'SKUs with pricing and stock info'
  },
  {
    name: 'carts', displayName: 'Carts', icon: '🛒', color: '#14b8a6',
    fields: 4, relations: ['users', 'cart_items'],
    description: 'Active shopping carts (1 per user)'
  },
  {
    name: 'cart_items', displayName: 'Cart Items', icon: '🔖', color: '#0ea5e9',
    fields: 6, relations: ['carts', 'products'],
    description: 'Line items in active carts'
  },
  {
    name: 'orders', displayName: 'Orders', icon: '📋', color: '#f97316',
    fields: 18, relations: ['users', 'addresses', 'order_items', 'order_timeline', 'wallet_transactions'],
    description: 'Placed orders with status tracking'
  },
  {
    name: 'order_items', displayName: 'Order Items', icon: '🧾', color: '#ef4444',
    fields: 10, relations: ['orders', 'products'],
    description: 'Snapshot of products in each order'
  },
  {
    name: 'order_timeline', displayName: 'Order Timeline', icon: '📅', color: '#84cc16',
    fields: 5, relations: ['orders'],
    description: 'Status history events per order'
  },
  {
    name: 'wallets', displayName: 'Wallets', icon: '💰', color: '#a855f7',
    fields: 5, relations: ['users', 'wallet_transactions'],
    description: 'User wallet with current balance'
  },
  {
    name: 'wallet_transactions', displayName: 'Wallet Txns', icon: '💳', color: '#8b5cf6',
    fields: 12, relations: ['wallets', 'orders'],
    description: 'All credit/debit/refund transactions'
  },
  {
    name: 'banners', displayName: 'Banners', icon: '🖼️', color: '#06b6d4',
    fields: 9, relations: [],
    description: 'Home screen promotional banners'
  },
  {
    name: 'coupons', displayName: 'Coupons', icon: '🎟️', color: '#d97706',
    fields: 13, relations: [],
    description: 'Discount codes with usage limits'
  },
  {
    name: 'notifications', displayName: 'Notifications', icon: '🔔', color: '#f43f5e',
    fields: 8, relations: ['users'],
    description: 'In-app notification messages'
  },
  {
    name: 'recently_viewed', displayName: 'Recently Viewed', icon: '👁️', color: '#64748b',
    fields: 4, relations: ['users', 'products'],
    description: 'User product browsing history'
  },
]

const ENUMS = [
  { name: 'Role', values: ['CUSTOMER', 'ADMIN'], color: '#6366f1' },
  { name: 'OrderStatus', values: ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'], color: '#f97316' },
  { name: 'PaymentMethod', values: ['WALLET', 'COD'], color: '#10b981' },
  { name: 'TransactionType', values: ['CREDIT', 'DEBIT', 'REFUND'], color: '#a855f7' },
  { name: 'TransactionStatus', values: ['PENDING', 'SUCCESS', 'FAILED'], color: '#14b8a6' },
  { name: 'AddressType', values: ['HOME', 'WORK', 'OTHER'], color: '#f59e0b' },
]

function StatBadge({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function TableCard({ table, loading }: { table: TableStat; loading: boolean }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      style={{ borderTop: `3px solid ${table.color}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${table.color}18` }}>
              {table.icon}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">{table.displayName}</div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{table.name}</div>
            </div>
          </div>

          {/* Row count */}
          <div className="text-right">
            {loading ? (
              <div className="h-7 w-12 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="text-2xl font-black" style={{ color: table.color }}>
                {table.count === null ? '—' : table.count.toLocaleString()}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-0.5">rows</div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3 leading-relaxed">{table.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            <Hash size={10} />
            {table.fields} fields
          </span>
          {table.relations.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              <Link2 size={10} />
              {table.relations.length} relations
            </span>
          )}
        </div>
      </div>

      {table.relations.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 flex flex-wrap gap-1.5">
          {table.relations.map(r => (
            <span key={r} className="text-xs font-mono text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-md">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableStat[]>(TABLE_META.map(t => ({ ...t, count: null })))
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [selectedEnum, setSelectedEnum] = useState<string | null>(null)

  const fetchCounts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/db-stats')
      const data = res.data.data
      setTables(prev => prev.map(t => ({
        ...t,
        count: data[t.name] ?? null
      })))
    } catch {
      // API not reachable, just show null counts
    }
    setLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => { fetchCounts() }, [])

  const totalFields = TABLE_META.reduce((acc, t) => acc + t.fields, 0)
  const totalRelations = 16

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={20} className="text-indigo-500" />
            <h2 className="text-2xl font-bold text-gray-900">Database Explorer</h2>
          </div>
          <p className="text-sm text-gray-400">
            PostgreSQL · Supabase · Prisma ORM
            {lastRefresh && (
              <span className="ml-2 text-gray-300">
                · refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/prisma/db-diagram.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
          >
            <ExternalLink size={15} />
            Open ER Diagram
          </a>
          <button
            onClick={fetchCounts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <StatBadge value={TABLE_META.length} label="tables" color="#6366f1" />
          <StatBadge value={ENUMS.length} label="enums" color="#a855f7" />
          <StatBadge value={totalFields} label="total fields" color="#10b981" />
          <StatBadge value={totalRelations} label="relations" color="#f59e0b" />
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Connected to Supabase
          </div>
        </div>
      </div>

      {/* Tables grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tables ({TABLE_META.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map(table => (
            <TableCard key={table.name} table={table} loading={loading} />
          ))}
        </div>
      </div>

      {/* Enums section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Enums ({ENUMS.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ENUMS.map(en => (
            <button
              key={en.name}
              onClick={() => setSelectedEnum(selectedEnum === en.name ? null : en.name)}
              className="text-left rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              style={{ borderTop: `3px solid ${en.color}`, borderColor: selectedEnum === en.name ? en.color : undefined }}
            >
              <div className="p-3">
                <div className="text-xs font-bold text-gray-600 mb-1">enum</div>
                <div className="font-bold text-gray-900 text-sm mb-2" style={{ color: en.color }}>{en.name}</div>
                {selectedEnum === en.name ? (
                  <div className="space-y-1">
                    {en.values.map(v => (
                      <div key={v} className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                        {v}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">{en.values.length} values · tap to expand</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ER Diagram embed hint */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Database size={22} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-900 mb-1">Interactive ER Diagram</div>
          <div className="text-sm text-gray-500">
            See all 15 tables, 16 relations and 5 enums visualised with clickable, zoomable cards.
            Open <code className="text-indigo-600 bg-indigo-50 px-1 rounded">apps/api/prisma/db-diagram.html</code> in your browser.
          </div>
        </div>
        <a
          href="file:///d:/zepto/apps/api/prisma/db-diagram.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          Open Diagram
          <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  )
}
