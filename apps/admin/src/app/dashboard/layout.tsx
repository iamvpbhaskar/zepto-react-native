'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { loadStoredToken, clearAuthToken } from '@/lib/api'
import {
  LayoutDashboard, ShoppingBag, Tag, ClipboardList,
  Users, Wallet, BarChart2, LogOut, Menu, X, Zap
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/products', label: 'Products', icon: ShoppingBag },
  { href: '/dashboard/categories', label: 'Categories', icon: Tag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const token = loadStoredToken()
    if (!token) router.replace('/login')
  }, [router])

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    router.replace('/login')
  }

  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarCollapsed(!sidebarCollapsed)
    } else {
      setMobileSidebarOpen(!mobileSidebarOpen)
    }
  }

  const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={clsx("flex flex-col h-full bg-gray-900 text-white transition-all duration-300", collapsed ? "w-20" : "w-64")}>
      {/* Logo */}
      <div className={clsx("flex items-center border-b border-gray-800 transition-all duration-300", collapsed ? "justify-center py-5" : "gap-3 px-6 py-5")}>
        <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/25">
          <Zap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="transition-opacity duration-300">
            <span className="font-bold text-white text-lg tracking-tight">Zepto</span>
            <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx("flex-1 py-4 space-y-1 overflow-y-auto transition-all duration-300", collapsed ? "px-2" : "px-4")}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileSidebarOpen(false)}
              className={clsx(
                'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                  : 'text-gray-400 hover:bg-gray-850 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-950 text-xs text-white font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-800">
                  {label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className={clsx("py-4 border-t border-gray-800 transition-all duration-300", collapsed ? "px-2" : "px-4")}>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className={clsx(
            "flex items-center rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-850 hover:text-red-400 transition-all duration-200 group relative w-full",
            collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
          
          {/* Tooltip for collapsed mode */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-950 text-xs text-red-400 font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-gray-800">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={clsx("hidden lg:flex flex-shrink-0 flex-col transition-all duration-300", sidebarCollapsed ? "w-20" : "w-64")}>
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl animate-slide-in">
            <Sidebar collapsed={false} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
              onClick={toggleSidebar}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              {navItems.find(n => pathname.startsWith(n.href))?.label ?? 'Dashboard'}
            </h1>
          </div>
          
          {/* Interactive User Avatar Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shadow-green-500/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/25"
            >
              A
            </button>
            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-150 rounded-xl shadow-xl py-1.5 z-20 transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <span className="block text-sm font-bold text-gray-800">Admin User</span>
                    <span className="block text-xs text-gray-500 font-medium">bhaskar@zepto.com</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      handleLogout()
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}

