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
  getAnalysisBaseSKUs,
} from "@/lib/api"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<"historical" | "performance" | "bestsellers" | "income">("historical")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [historicalSku, setHistoricalSku] = useState("")
  const [skuSuggestions, setSkuSuggestions] = useState<string[]>([])
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)
  const skuInputRef = useRef<HTMLDivElement>(null)

  const [historicalData, setHistoricalData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [bestSellersData, setBestSellersData] = useState<any[]>([])
  const [totalIncomeData, setTotalIncomeData] = useState<any>(null)
  const [bestSellersYear, setBestSellersYear] = useState<number>(new Date().getFullYear())
  const [bestSellersMonth, setBestSellersMonth] = useState<number>(new Date().getMonth() + 1)
  const [isLoading, setIsLoading] = useState(false)

  const [backendConnected, setBackendConnected] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    if (activeTab === "income") {
      loadTotalIncome()
    } else if (activeTab === "bestsellers") {
      loadBestSellers()
    } else if (activeTab === "performance") {
      loadAvailableProducts()
    }
  }, [activeTab])

  const loadHistoricalSales = async () => {
    if (!historicalSku.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const data = await getAnalysisHistoricalSales(historicalSku)

      if (data.success) {
        setHistoricalData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setHistoricalData({ chart_data: [], table_data: [], sizes: [], message: data.message })
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("Error loading historical sales:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setHistoricalData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSkuSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSkuSuggestions([])
      setShowSkuDropdown(false)
      return
    }

    try {
      const data = await getAnalysisBaseSKUs(searchTerm)

      if (data && data.success && data.base_skus.length > 0) {
        setSkuSuggestions(data.base_skus)
        setShowSkuDropdown(true)
      } else {
        setSkuSuggestions([])
        setShowSkuDropdown(false)
      }
    } catch (error) {
      console.error("Error fetching SKU suggestions:", error)
      setSkuSuggestions([])
      setShowSkuDropdown(false)
    }
  }

  const handleSkuInputChange = (value: string) => {
    setHistoricalSku(value)
    fetchSkuSuggestions(value)
  }

  const handleSelectSku = (sku: string) => {
    setHistoricalSku(sku)
    setShowSkuDropdown(false)
    setSkuSuggestions([])
  }

  const loadPerformanceComparison = async () => {
    if (selectedProducts.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      const data = await getAnalysisPerformance(selectedProducts)

      if (data.success) {
        setPerformanceData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setPerformanceData({ chart_data: {}, table_data: [], message: data.message })
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("Error loading performance comparison:", error)
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
      const validYear = Number.isNaN(bestSellersYear) ? new Date().getFullYear() : bestSellersYear
      const validMonth = Number.isNaN(bestSellersMonth) ? new Date().getMonth() + 1 : bestSellersMonth

      const data = await getAnalysisBestSellers(validYear, validMonth, 10)

      if (data.success) {
        setBestSellersData(data.data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setBestSellersData([])
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("Error loading best sellers:", error)
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
      const data = await getAnalysisTotalIncome()

      if (data.success) {
        setTotalIncomeData(data)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        setTotalIncomeData(null)
        setBackendConnected(true)
      }
    } catch (error) {
      console.error("Error loading total income:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setTotalIncomeData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableProducts = async () => {
    try {
      const data = await getAnalysisBaseSKUs("")
      if (data && data.success && data.base_skus.length > 0) {
        setAvailableProducts(data.base_skus)
        if (selectedProducts.length === 0) {
          setSelectedProducts(data.base_skus.slice(0, 3))
        }
      }
    } catch (error) {
      console.error("Error loading available products:", error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skuInputRef.current && !skuInputRef.current.contains(event.target as Node)) {
        setShowSkuDropdown(false)
      }
    }

    if (showSkuDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSkuDropdown])

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
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        if (prev.length > 1) {
          return prev.filter((p) => p !== product)
        }
        return prev
      } else {
        if (prev.length < 3) {
          return [...prev, product]
        }
        return prev
      }
    })
  }

  const filteredProducts = availableProducts.filter((product) =>
    product.toLowerCase().includes(productSearch.toLowerCase()),
  )

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
                <h3 className="text-xl font-bold text-black">Historical Stock Data</h3>
                <div className="flex gap-2 relative" ref={skuInputRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by SKU or category..."
                      value={historicalSku}
                      onChange={(e) => handleSkuInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadHistoricalSales()}
                      onFocus={() => historicalSku.trim() && skuSuggestions.length > 0 && setShowSkuDropdown(true)}
                      className="w-80 px-4 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                    />
                    {showSkuDropdown && skuSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#cecabf] rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {skuSuggestions.map((sku) => (
                          <button
                            key={sku}
                            onClick={() => handleSelectSku(sku)}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-[#f8f5ee] transition-colors"
                          >
                            {sku}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <p>Enter a SKU or category above to view historical stock data</p>
                  <p className="text-xs mt-2">You can search by product SKU or category name</p>
                </div>
              )}

              {historicalData && historicalData.chart_data.length > 0 ? (
                <>
                  <div className="mb-8">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={historicalData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                        <XAxis dataKey="category" stroke="#938d7a" />
                        <YAxis stroke="#938d7a" />
                        <Legend />
                        <Bar dataKey="total_stock" fill="#938d7a" name="Total Stock" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#efece3]">
                          <th className="text-left py-3 px-4 text-sm font-medium text-black">SKU</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-black">Product Name</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-black">Stock Level</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-black">Category</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-black">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicalData.table_data.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-[#efece3]">
                            <td className="py-3 px-4 text-sm text-black font-medium">{row.product_sku}</td>
                            <td className="py-3 px-4 text-sm text-black">{row.product_name}</td>
                            <td className="py-3 px-4 text-sm text-black text-center">{row.stock_level}</td>
                            <td className="py-3 px-4 text-sm text-black text-center">{row.category}</td>
                            <td className="py-3 px-4 text-sm text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  row.flag === "active"
                                    ? "bg-green-100 text-green-800"
                                    : row.flag === "inactive"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {row.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : historicalData && historicalData.chart_data.length === 0 ? (
                <div className="text-center py-12 text-[#938d7a]">
                  <p>{historicalData.message || "No data found for this search"}</p>
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
                  <div className="flex gap-2 relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                      className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium flex items-center gap-2 transition-all"
                    >
                      <Package2 className="w-4 h-4" />
                      {selectedProducts.length > 0 ? `${selectedProducts.length} Selected` : "Select Products"}
                    </button>
                  </div>
                  <button
                    onClick={loadPerformanceComparison}
                    disabled={isLoading || selectedProducts.length === 0}
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
                          <th className="text-right py-3 px-4 text-sm font-medium text-black">Total Quantity</th>
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
                  <p>
                    {selectedProducts.length === 0
                      ? "Select products to compare"
                      : "Select products and click Compare to view performance data"}
                  </p>
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
                    value={bestSellersYear || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setBestSellersYear(val === "" ? new Date().getFullYear() : Number.parseInt(val, 10))
                    }}
                    className="w-24 px-3 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                  />
                  <input
                    type="number"
                    placeholder="Month"
                    value={bestSellersMonth || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setBestSellersMonth(val === "" ? new Date().getMonth() + 1 : Number.parseInt(val, 10))
                    }}
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
                            label={{ value: "Month", position: "insideBottom", offset: -5 }}
                          />
                          <YAxis stroke="#938d7a" label={{ value: "Income (฿)", angle: -90, position: "insideLeft" }} />
                          <Legend />
                          <Bar dataKey="total_income" fill="#938d7a" name="Total Income (฿)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#efece3]">
                            <th className="text-left py-3 px-4 text-sm font-medium text-black">Product</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-black">Avg Monthly Revenue</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-black">Total Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {totalIncomeData.table_data.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-[#efece3]">
                              <td className="py-3 px-4 text-sm text-black">{item.Product_name}</td>
                              <td className="py-3 px-4 text-sm text-black text-right">
                                ฿{Math.round(item.Avg_Monthly_Revenue_Baht).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-black text-right">
                                {item.Total_Quantity.toLocaleString()}
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
                    <p>Loading total income data...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Product Selection Dropdown */}
      {showProductDropdown && (
        <div
          ref={dropdownRef}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setShowProductDropdown(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-black">Select Products (Max 3)</h4>
              <button onClick={() => setShowProductDropdown(false)} className="text-[#938d7a] hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
            />

            <div className="space-y-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={product}
                    onClick={() => toggleProduct(product)}
                    disabled={!selectedProducts.includes(product) && selectedProducts.length >= 3}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedProducts.includes(product)
                        ? "bg-[#cecabf] border-[#938d7a] text-black"
                        : "bg-white border-[#efece3] text-black hover:bg-[#f8f5ee]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{product}</span>
                      {selectedProducts.includes(product) && (
                        <span className="text-xs bg-white px-2 py-1 rounded">Selected</span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-[#938d7a] py-4">No products available</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#efece3]">
              <p className="text-xs text-[#938d7a]">Selected: {selectedProducts.length}/3 products</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
