'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@zepto/utils'

export default function WalletPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/wallet/transactions?page=${page}&limit=20`)
      setTransactions(res.data.data.transactions)
      setTotal(res.data.data.total)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTransactions() }, [page])

  const typeColor: Record<string, string> = {
    CREDIT: 'bg-green-100 text-green-700',
    DEBIT: 'bg-red-100 text-red-600',
    REFUND: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Wallet Transactions</h2>
        <p className="text-gray-500 text-sm">{total} total transactions</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Balance After</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Description</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{tx.wallet?.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400">+91 {tx.wallet?.user?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeColor[tx.type] ?? ''}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      <span className={tx.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}>
                        {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(Number(tx.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {formatCurrency(Number(tx.balanceAfter))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                        tx.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate">{tx.description}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(tx.createdAt)}</td>
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
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50">← Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50">Next →</button>
        </div>
      </div>
    </div>
  )
}
