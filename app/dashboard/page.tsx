"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  Home,
  Package,
  TrendingUp,
  BookOpen,
  Bell,
  Package2,
  FileText,
  TrendingUpIcon as TrendingIcon,
  AlertTriangle,
  BookIcon,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react"
import { getDashboardAnalytics } from "@/lib/api"

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    total_stock_items: 3456,
    low_stock_alerts: 7,
    sales_this_month: 54000,
    out_of_stock: 4,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await getDashboardAnalytics()
        if (response.success) {
          setDashboardData(response.data)
          setBackendConnected(true)
        } else {
          setBackendConnected(false)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch dashboard data:", error)
        setBackendConnected(false)
      } finally {
        setIsLoading(false)
        setCheckingConnection(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f5ee]">
      {/* Header */}
      <header className="bg-white border-b border-[#efece3] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-serif text-black">Lon TukTak</h1>
            <p className="text-xs text-[#938d7a]">Stock Management</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#938d7a]" />
              <input
                type="text"
                placeholder="Search for stocks & more"
                className="w-full pl-10 pr-4 py-2 bg-[#f8f5ee] rounded-lg border-none outline-none text-sm text-black placeholder:text-[#938d7a] focus:ring-2 focus:ring-[#938d7a]/20"
              />
            </div>
          </div>

          {/* User Profile with Backend Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8f5ee]">
              {checkingConnection ? (
                <>
                  <div className="w-2 h-2 bg-[#938d7a] rounded-full animate-pulse" />
                  <span className="text-xs text-[#938d7a]">Checking...</span>
                </>
              ) : backendConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-[#00a63e]" />
                  <span className="text-xs text-[#00a63e] font-medium">Backend Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-[#f76666]" />
                  <span className="text-xs text-[#f76666] font-medium">Backend Offline</span>
                </>
              )}
            </div>

            <div className="w-10 h-10 bg-[#ffd700] rounded flex items-center justify-center font-bold text-black text-sm">
              TG
            </div>
            <div>
              <p className="text-sm font-medium text-black">Toogletons</p>
              <p className="text-xs text-[#938d7a]">Toogletons@gmail.com</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-52 bg-[#efece3] min-h-[calc(100vh-73px)] p-4">
          <p className="text-xs text-[#938d7a] mb-4 px-3">Navigation</p>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg text-black font-medium"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard/stocks"
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Stocks</span>
            </Link>
            <Link
              href="/dashboard/predict"
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Predict</span>
            </Link>
            <Link
              href="/dashboard/analysis"
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Analysis</span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Dashboard Overview</h2>
            <p className="text-[#938d7a]">Monitor your inventory status and performance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Stock Items */}
            <div className="bg-[#ebf9f3] rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#1e1e1e] mb-1">Total Stock Items</p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading ? "..." : dashboardData.total_stock_items.toLocaleString()}
                  </p>
                </div>
                <Package2 className="w-5 h-5 text-[#1e1e1e]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-[#00a63e] text-white px-2 py-1 rounded">+2% from last month</span>
                <Link href="/dashboard/stocks" className="text-sm text-[#1e1e1e] underline">
                  View
                </Link>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#1e1e1e] mb-1">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-black">{isLoading ? "..." : dashboardData.low_stock_alerts}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-[#1e1e1e]" />
              </div>
              <span className="text-xs bg-[#f76666] text-white px-2 py-1 rounded">-6% from last month</span>
            </div>

            {/* Sales This Month */}
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#1e1e1e] mb-1">Sales This Month</p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading ? "..." : `${dashboardData.sales_this_month.toLocaleString()} Baht`}
                  </p>
                </div>
                <TrendingIcon className="w-5 h-5 text-[#1e1e1e]" />
              </div>
              <span className="text-xs bg-[#00a63e] text-white px-2 py-1 rounded">+15% from last month</span>
            </div>

            {/* Out of Stock */}
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#1e1e1e] mb-1">Out of Stock</p>
                  <p className="text-3xl font-bold text-black">{isLoading ? "..." : dashboardData.out_of_stock}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-[#1e1e1e] rotate-180" />
              </div>
              <span className="text-xs bg-[#1e1e1e] text-white px-2 py-1 rounded">same as last month</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
            <h3 className="text-xl font-bold text-black mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add New Items */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <Package2 className="w-8 h-8 text-black" />
                <span className="text-black font-medium">Add New Items</span>
              </button>

              {/* Generate Report */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <FileText className="w-8 h-8 text-black" />
                <span className="text-black font-medium">Generate Report</span>
              </button>

              {/* Check Trends */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <TrendingIcon className="w-8 h-8 text-black" />
                <span className="text-black font-medium">Check Trends</span>
              </button>

              {/* View Alerts */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <AlertTriangle className="w-8 h-8 text-black" />
                <span className="text-black font-medium">View Alerts</span>
              </button>

              {/* Analyze Sales */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <BookIcon className="w-8 h-8 text-black" />
                <span className="text-black font-medium">Analyze Sales</span>
              </button>

              {/* Predict Sales */}
              <button className="flex flex-col items-center justify-center gap-3 p-6 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors">
                <Sun className="w-8 h-8 text-black" />
                <span className="text-black font-medium">Predict Sales</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
