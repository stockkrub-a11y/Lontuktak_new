"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Home,
  Package,
  TrendingUp,
  BookOpen,
  Bell,
  BarChart3,
  GitCompare,
  Award,
  DollarSign,
  Package2,
  Wifi,
  WifiOff,
  X,
  AlertCircle,
} from "lucide-react"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Bar,
  BarChart,
  Legend,
} from "recharts"
import {
  getAnalysisHistoricalSales,
  getAnalysisPerformance,
  getAnalysisBestSellers,
  getAnalysisTotalIncome,
} from "@/lib/api"

const allProducts = ["Shinchan Boxers", "Deep Sleep", "Long Pants", "Basic T-Shirt", "Premium Shirt"]

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<"historical" | "performance" | "bestsellers" | "income">("historical")
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["Shinchan Boxers", "Deep Sleep", "Long Pants"])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [historicalSku, setHistoricalSku] = useState("")
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [bestSellersData, setBestSellersData] = useState<any[]>([])
  const [totalIncomeData, setTotalIncomeData] = useState<any>(null)
  const [bestSellersYear, setBestSellersYear] = useState(new Date().getFullYear())
  const [bestSellersMonth, setBestSellersMonth] = useState(new Date().getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)

  const [backendConnected, setBackendConnected] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    if (activeTab === "income") {
      loadTotalIncome()
    } else if (activeTab === "bestsellers") {
      loadBestSellers()
    }
  }, [activeTab])

  const loadHistoricalSales = async () => {
    if (!historicalSku.trim()) {
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] Loading historical sales for SKU:", historicalSku)
      const data = await getAnalysisHistoricalSales(historicalSku)
      console.log("[v0] Historical sales response:", data)

      if (data.success) {
        setHistoricalData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setHistoricalData({ chart_data: [], table_data: [], sizes: [], message: data.message })
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("[v0] Error loading historical sales:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setHistoricalData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPerformanceComparison = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Loading performance comparison for:", selectedProducts)
      const data = await getAnalysisPerformance(selectedProducts)
      console.log("[v0] Performance comparison response:", data)

      if (data.success) {
        setPerformanceData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setPerformanceData({ chart_data: {}, table_data: [], message: data.message })
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("[v0] Error loading performance comparison:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setPerformanceData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBestSellers = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Loading best sellers for:", bestSellersYear, bestSellersMonth)
      const data = await getAnalysisBestSellers(bestSellersYear, bestSellersMonth, 10)
      console.log("[v0] Best sellers response:", data)

      if (data.success) {
        setBestSellersData(data.data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setBestSellersData([])
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("[v0] Error loading best sellers:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setBestSellersData([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTotalIncome = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Loading total income...")
      const data = await getAnalysisTotalIncome()
      console.log("[v0] Total income response:", data)

      if (data.success) {
        setTotalIncomeData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setTotalIncomeData(null)
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("[v0] Error loading total income:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setTotalIncomeData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
    }

    if (showProductDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProductDropdown])

  const toggleProduct = (product: string) => {
    console.log("[v0] Toggle called for:", product)
    console.log("[v0] Current selected:", selectedProducts)

    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        if (prev.length > 1) {
          const newSelected = prev.filter((p) => p !== product)
          console.log("[v0] Removed product, new selected:", newSelected)
          return newSelected
        }
        console.log("[v0] Cannot remove last product")
        return prev
      } else {
        if (prev.length < 3) {
          const newSelected = [...prev, product]
          console.log("[v0] Added product, new selected:", newSelected)
          return newSelected
        }
        console.log("[v0] Cannot add more than 3 products")
        return prev
      }
    })
  }

  const filteredProducts = allProducts.filter((product) => product.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#f8f5ee]">
      {/* Header */}
      <header className="bg-white border-b border-[#efece3] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-black">Lon TukTak</h1>
            <p className="text-xs text-[#938d7a]">Stock Management</p>
          </div>

          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#938d7a]" />
              <input
                type="text"
                placeholder="Search for stocks & more"
                className="w-full pl-10 pr-4 py-2 bg-[#f8f5ee] rounded-lg border-none outline-none text-sm text-black placeholder:text-[#938d7a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f5ee]">
              {backendConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Backend Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-600 font-medium">Backend Offline</span>
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
        {/* Sidebar */}
        <aside className="w-52 bg-[#efece3] min-h-[calc(100vh-73px)] p-4">
          <p className="text-xs text-[#938d7a] mb-4 px-3">Navigation</p>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
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
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg text-black font-medium"
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
          {showOfflineBanner && !backendConnected && (
            <div className="mb-6 bg-[#fff4e6] border border-[#eaac54] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#eaac54] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-black mb-1">Backend Server Offline</h4>
                  <p className="text-sm text-[#938d7a] mb-2">
                    The analysis features require the backend server to be running. Start it with:
                  </p>
                  <code className="block bg-white px-3 py-2 rounded text-sm font-mono text-black">
                    python scripts/Backend.py
                  </code>
                </div>
                <button
                  onClick={() => setShowOfflineBanner(false)}
                  className="text-[#938d7a] hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Analyze Sales</h2>
            <p className="text-[#938d7a]">Gain insights into sales trends, top performers, and total income growth</p>
          </div>

          {/* Tab Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setActiveTab("historical")}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                activeTab === "historical"
                  ? "bg-[#cecabf] border-[#938d7a] shadow-md"
                  : "bg-white border-[#efece3] hover:bg-[#efece3]"
              }`}
            >
              <BarChart3 className="w-5 h-5 text-black" />
              <div className="text-left">
                <p className="font-medium text-black">Historical Sales</p>
                <p className="text-xs text-[#938d7a]">View sales & trends over time</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("performance")}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                activeTab === "performance"
                  ? "bg-[#cecabf] border-[#938d7a] shadow-md"
                  : "bg-white border-[#efece3] hover:bg-[#efece3]"
              }`}
            >
              <GitCompare className="w-5 h-5 text-black" />
              <div className="text-left">
                <p className="font-medium text-black">Performance Comparison</p>
                <p className="text-xs text-[#938d7a]">Compare top SKU performance</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("bestsellers")}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                activeTab === "bestsellers"
                  ? "bg-[#cecabf] border-[#938d7a] shadow-md"
                  : "bg-white border-[#efece3] hover:bg-[#efece3]"
              }`}
            >
              <Award className="w-5 h-5 text-black" />
              <div className="text-left">
                <p className="font-medium text-black">Best Sellers</p>
                <p className="text-xs text-[#938d7a]">Top 10 performing products</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("income")}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                activeTab === "income"
                  ? "bg-[#cecabf] border-[#938d7a] shadow-md"
                  : "bg-white border-[#efece3] hover:bg-[#efece3]"
              }`}
            >
              <DollarSign className="w-5 h-5 text-black" />
              <div className="text-left">
                <p className="font-medium text-black">Total Income</p>
                <p className="text-xs text-[#938d7a]">Income growth analysis</p>
              </div>
            </button>
          </div>

          {/* Historical Sales View */}
          {activeTab === "historical" && (
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Historical Sales</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter SKU or Base SKU..."
                    value={historicalSku}
                    onChange={(e) => setHistoricalSku(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadHistoricalSales()}
                    className="px-4 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                  />
                  <button
                    onClick={loadHistoricalSales}
                    disabled={isLoading || !historicalSku.trim()}
                    className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Loading..." : "Search"}
                  </button>
                </div>
              </div>

              {!historicalSku.trim() && !historicalData && (
                <div className="text-center py-12 text-[#938d7a]">
                  <p>Enter a SKU above and click Search to view historical sales data</p>
                </div>
              )}

              {historicalData && historicalData.chart_data.length > 0 ? (
                <>
                  <div className="mb-8">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={historicalData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                        <XAxis dataKey="month" stroke="#938d7a" />
                        <YAxis stroke="#938d7a" />
                        <Legend />
                        {historicalData.sizes.map((size: string, idx: number) => (
                          <Bar
                            key={size}
                            dataKey={size}
                            stackId="a"
                            fill={["#d4cfc4", "#b8b3a8", "#efece3", "#e8e4d9", "#cecabf"][idx % 5]}
                            name={`Size ${size}`}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#efece3]">
                          <th className="text-left py-3 px-4 text-sm font-medium text-black">Date</th>
                          {historicalData.sizes.map((size: string) => (
                            <th key={size} className="text-center py-3 px-4 text-sm font-medium text-black">
                              {size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historicalData.table_data.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-[#efece3]">
                            <td className="py-3 px-4 text-sm text-black">{row.date}</td>
                            {historicalData.sizes.map((size: string) => (
                              <td key={size} className="py-3 px-4 text-sm text-black text-center">
                                {row[size] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : historicalData && historicalData.chart_data.length === 0 ? (
                <div className="text-center py-12 text-[#938d7a]">
                  <p>{historicalData.message || "No data found for this SKU"}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Performance Comparison View */}
          {activeTab === "performance" && (
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Performance Comparison (Top 3 SKUs)</h3>
                <div className="flex gap-2">
                  {/* ... existing product selection buttons ... */}
                  <div className="flex gap-2 relative" ref={dropdownRef}>
                    {selectedProducts.slice(0, 3).map((product, index) => (
                      <button
                        key={product}
                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-black flex items-center gap-2 transition-all ${
                          index === 0
                            ? "bg-[#cecabf] hover:bg-[#b8b3a8]"
                            : "bg-white border border-[#cecabf] hover:bg-[#efece3]"
                        }`}
                      >
                        <Package2 className="w-4 h-4" />
                        Product {index + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={loadPerformanceComparison}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Compare"}
                  </button>
                </div>
              </div>

              {performanceData && performanceData.table_data.length > 0 ? (
                <>
                  <div className="mb-8">
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                        <XAxis type="number" dataKey="month" name="Month" domain={[0, 13]} stroke="#938d7a" />
                        <YAxis type="number" dataKey="value" name="Value" stroke="#938d7a" />
                        {Object.entries(performanceData.chart_data).map(([sku, data]: [string, any], idx) => (
                          <Scatter key={sku} name={sku} data={data} fill={["#ef4444", "#10b981", "#f59e0b"][idx % 3]} />
                        ))}
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#efece3]">
                          <th className="text-left py-3 px-4 text-sm font-medium text-black">SKU</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-black">Product</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-black">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.table_data.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-[#efece3]">
                            <td className="py-3 px-4 text-sm text-black font-medium">{item.Item}</td>
                            <td className="py-3 px-4 text-sm text-black">{item.Product_name || "N/A"}</td>
                            <td className="py-3 px-4 text-sm text-black text-right">{item.Quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-[#938d7a]">
                  <p>Select products and click Compare to view performance data</p>
                </div>
              )}
            </div>
          )}

          {/* Best Sellers View */}
          {activeTab === "bestsellers" && (
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Top 10 Best Sellers</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Year"
                    value={bestSellersYear}
                    onChange={(e) => setBestSellersYear(Number.parseInt(e.target.value))}
                    className="w-24 px-3 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                  />
                  <input
                    type="number"
                    placeholder="Month"
                    value={bestSellersMonth}
                    onChange={(e) => setBestSellersMonth(Number.parseInt(e.target.value))}
                    min="1"
                    max="12"
                    className="w-20 px-3 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                  />
                  <button
                    onClick={loadBestSellers}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Loading..." : "Load"}
                  </button>
                </div>
              </div>

              {bestSellersData.length > 0 ? (
                <div className="space-y-4">
                  {bestSellersData.map((item) => (
                    <div key={item.rank} className="flex items-center gap-4 p-4 bg-[#f8f5ee] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-[#cecabf] flex items-center justify-center font-bold text-black">
                        {item.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-black">{item.name}</p>
                            <p className="text-sm text-[#938d7a]">
                              SKU: {item.base_sku} | Size: {item.size}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#938d7a]">Quantity</p>
                            <p className="font-bold text-black">{item.quantity}</p>
                          </div>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-[#938d7a] h-2 rounded-full"
                            style={{ width: `${(item.quantity / bestSellersData[0]?.quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#938d7a]">
                  <p>Select a year and month, then click Load to view best sellers</p>
                </div>
              )}
            </div>
          )}

          {/* Total Income View */}
          {activeTab === "income" && (
            <div className="space-y-6">
              {totalIncomeData ? (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-6 border border-blue-200">
                      <p className="text-3xl font-bold text-blue-600 mb-2">
                        ฿{totalIncomeData.grand_total.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-800 font-medium">Total Annual Income</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-6 border border-green-200">
                      <p className="text-3xl font-bold text-green-600 mb-2">
                        ฿
                        {totalIncomeData.table_data.length > 0
                          ? Math.round(
                              totalIncomeData.table_data.reduce(
                                (sum: number, item: any) => sum + item.Avg_Monthly_Revenue_Baht,
                                0,
                              ) / totalIncomeData.table_data.length,
                            ).toLocaleString()
                          : 0}
                      </p>
                      <p className="text-sm text-green-800 font-medium">Average Monthly Income</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-6 border border-purple-200">
                      <p className="text-3xl font-bold text-purple-600 mb-2">{totalIncomeData.table_data.length}</p>
                      <p className="text-sm text-purple-800 font-medium">Active Products</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
                    <h3 className="text-xl font-bold text-black mb-6">Total Income Growth</h3>

                    <div className="mb-8">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={totalIncomeData.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                          <XAxis
                            dataKey="month"
                            stroke="#938d7a"
                            label={{ value: "Months", position: "insideBottom", offset: -5 }}
                          />
                          <YAxis stroke="#938d7a" />
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#000000"
                            strokeWidth={2}
                            dot={{ fill: "#000000", r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#efece3]">
                            <th className="text-left py-3 px-4 text-sm font-medium text-black">SKU</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-black">Product Name</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-black">Months Active</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-black">Total Income</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-black">Avg Monthly Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          {totalIncomeData.table_data.slice(0, 20).map((item: any, index: number) => (
                            <tr key={index} className="border-b border-[#efece3]">
                              <td className="py-3 px-4 text-sm text-black">{item.Product_SKU}</td>
                              <td className="py-3 px-4 text-sm text-black">{item.Product_name || "N/A"}</td>
                              <td className="py-3 px-4 text-sm text-black text-center">{item.Months_Active}</td>
                              <td className="py-3 px-4 text-sm text-black text-right">
                                ฿{Math.round(item.Total_Revenue_Baht).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-black text-right">
                                ฿{Math.round(item.Avg_Monthly_Revenue_Baht).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
                  <div className="text-center py-12 text-[#938d7a]">
                    <p>{isLoading ? "Loading total income data..." : "No income data available"}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
