'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatDate, formatCurrency } from '@zepto/utils'
import type { User } from '@zepto/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/customers?page=${page}&limit=20`)
      setCustomers(res.data.data.customers)
      setTotal(res.data.data.total)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [page])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <p className="text-gray-500 text-sm">{total} registered customers</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Wallet Balance</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Orders</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(customer.name ?? customer.phone)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name ?? 'Unnamed'}</p>
                          <p className="text-xs text-gray-400">{customer.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">+91 {customer.phone}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatCurrency(Number(customer.wallet?.balance ?? 0))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        {customer._count?.orders ?? 0} orders
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50">
            ← Prev
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
