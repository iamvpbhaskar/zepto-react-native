'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Category } from '@zepto/types'
import { Tag } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/categories')
      setCategories(res.data.data.categories)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  const toggleActive = async (id: string, isActive: boolean) => {
    await api.put(`/admin/categories/${id}`, { isActive: !isActive })
    fetchCategories()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <p className="text-gray-500 text-sm">{categories.length} categories</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-36 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          : categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Tag size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(cat as any)._count?.products ?? 0} products
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleActive(cat.id, cat.isActive)}
                    className="text-xs text-gray-400 hover:text-gray-700 underline"
                  >
                    {cat.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
