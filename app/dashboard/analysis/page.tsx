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
  getAnalysisPerformanceProducts, // Added import for performance products
} from "@/lib/api"
import { Button } from "@/components/ui/button" // Assuming Button component exists
import { useMediaQuery } from "@/hooks/useMediaQuery" // Assuming useMediaQuery hook exists

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<"historical" | "performance" | "sellers" | "income">("historical")
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [bestSellersData, setBestSellersData] = useState<any>(null)
  const [totalIncomeData, setTotalIncomeData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [backendConnected, setBackendConnected] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  // Historical Sales states
  const [selectedBaseSku, setSelectedBaseSku] = useState("")
  const [baseSKUs, setBaseSKUs] = useState<string[]>([])
  const [skuSearch, setSkuSearch] = useState("")
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)
  const skuInputRef = useRef<HTMLDivElement>(null)

  // Performance Comparison states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [productCategories, setProductCategories] = useState<
    Record<string, Array<{ product_sku: string; product_name: string }>>
  >({})
  const [allProducts, setAllProducts] = useState<
    Array<{ product_sku: string; product_name: string; category: string }>
  >([])
  const [productSearch, setProductSearch] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Best Sellers states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const [incomeProductFilter, setIncomeProductFilter] = useState("")
  const [incomeCategoryFilter, setIncomeCategoryFilter] = useState("")
  const [incomeProducts, setIncomeProducts] = useState<string[]>([])
  const [incomeCategories, setIncomeCategories] = useState<string[]>([])

  const isMobile = useMediaQuery("(max-width: 768px)")

  const loadHistoricalSales = async () => {
    if (!selectedBaseSku.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const data = await getAnalysisHistoricalSales(selectedBaseSku)

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
      setBaseSKUs([])
      setShowSkuDropdown(false)
      return
    }

    try {
      const data = await getAnalysisBaseSKUs(searchTerm)

      if (data && data.success && data.base_skus.length > 0) {
        setBaseSKUs(data.base_skus)
        setShowSkuDropdown(true)
      } else {
        setBaseSKUs([])
        setShowSkuDropdown(false)
      }
    } catch (error) {
      console.error("Error fetching SKU suggestions:", error)
      setBaseSKUs([])
      setShowSkuDropdown(false)
    }
  }

  const handleSkuInputChange = (value: string) => {
    setSkuSearch(value)
    setSelectedBaseSku(value)
    fetchSkuSuggestions(value)
  }

  const handleSelectSku = (sku: string) => {
    setSelectedBaseSku(sku)
    setSkuSearch(sku) // Update search term as well
    setShowSkuDropdown(false)
    setBaseSKUs([])
  }

  const loadBaseSKUs = async () => {
    try {
      const data = await getAnalysisBaseSKUs("") // Fetch all base SKUs
      if (data && data.success) {
        setBaseSKUs(data.base_skus)
      }
    } catch (error) {
      console.error("Error loading base SKUs:", error)
    }
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
      const validYear = Number.isNaN(selectedYear) ? new Date().getFullYear() : selectedYear
      const validMonth = Number.isNaN(selectedMonth) ? new Date().getMonth() + 1 : selectedMonth

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

  const loadTotalIncome = async (product_sku = "", category = "") => {
    setIsLoading(true)
    try {
      const data = await getAnalysisTotalIncome(product_sku, category)

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

  const loadIncomeFilterOptions = async () => {
    try {
      // Load products from base_data
      const productsData = await getAnalysisPerformanceProducts("")
      if (productsData.success && productsData.all_products) {
        const uniqueProducts = [...new Set(productsData.all_products.map((p) => p.product_sku))]
        const uniqueCategories = [...new Set(productsData.all_products.map((p) => p.category).filter(Boolean))]
        setIncomeProducts(uniqueProducts)
        setIncomeCategories(uniqueCategories)
      }
    } catch (error) {
      console.error("Error loading income filter options:", error)
    }
  }

  const loadAvailableProducts = async () => {
    try {
      console.log("[v0] Loading available products from database...")
      const data = await getAnalysisPerformanceProducts("")
      console.log("[v0] Received data from backend:", data)

      if (data.success) {
        console.log("[v0] Categories:", Object.keys(data.categories))
        console.log("[v0] Total products:", data.all_products.length)
        setProductCategories(data.categories)
        setAllProducts(data.all_products)
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        console.log("[v0] Backend returned success=false")
        setProductCategories({})
        setAllProducts([])
      }
    } catch (error) {
      console.error("[v0] Error loading available products:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setProductCategories({})
      setAllProducts([])
    }
  }

  const handleProductSearch = async (searchTerm: string) => {
    setProductSearch(searchTerm)

    if (!searchTerm.trim()) {
      // Reload all products when search is cleared
      loadAvailableProducts()
      return
    }

    try {
      const data = await getAnalysisPerformanceProducts(searchTerm)

      if (data.success) {
        setProductCategories(data.categories)
        setAllProducts(data.all_products)
      }
    } catch (error) {
      console.error("Error searching products:", error)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleProductSelect = (sku: string) => {
    if (selectedProducts.includes(sku)) {
      setSelectedProducts(selectedProducts.filter((s) => s !== sku))
    } else if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, sku])
    }
  }

  const handleApplyIncomeFilters = () => {
    loadTotalIncome(incomeProductFilter, incomeCategoryFilter)
  }

  const handleResetIncomeFilters = () => {
    setIncomeProductFilter("")
    setIncomeCategoryFilter("")
    loadTotalIncome("", "")
  }

  useEffect(() => {
    if (activeTab === "historical") {
      loadBaseSKUs()
    } else if (activeTab === "performance") {
      loadAvailableProducts()
    } else if (activeTab === "sellers") {
      // Changed from "bestsellers" to "sellers"
      loadBestSellers()
    } else if (activeTab === "income") {
      loadTotalIncome()
      loadIncomeFilterOptions()
    }
  }, [activeTab])

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
        setShowProductDialog(false) // Changed from setShowProductDropdown
      }
    }

    if (showProductDialog) {
      // Changed from showProductDropdown
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProductDialog]) // Changed from showProductDropdown

  const getFilteredProducts = () => {
    if (productSearch) {
      return allProducts.filter((product) => product.product_sku.toLowerCase().includes(productSearch.toLowerCase()))
    }
    return []
  }

  return (
    <div className="flex min-h-screen bg-[#f5f3ed]">
      {" "}
      {/* Changed background color */}
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
              onClick={() => setActiveTab("sellers")} // Changed from "bestsellers"
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                activeTab === "sellers" // Changed from "bestsellers"
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
                      value={skuSearch}
                      onChange={(e) => handleSkuInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadHistoricalSales()}
                      onFocus={() => skuSearch.trim() && baseSKUs.length > 0 && setShowSkuDropdown(true)}
                      className="w-80 px-4 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                    />
                    {showSkuDropdown && baseSKUs.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#cecabf] rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {baseSKUs.map((sku) => (
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
                    disabled={isLoading || !selectedBaseSku.trim()}
                    className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Loading..." : "Search"}
                  </button>
                </div>
              </div>

              {!selectedBaseSku.trim() && !historicalData && (
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
                      onClick={() => setShowProductDialog(!showProductDialog)} // Changed to showProductDialog
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
          {activeTab === "sellers" && ( // Changed from "bestsellers"
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Top 10 Best Sellers</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Year"
                    value={selectedYear || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedYear(val === "" ? new Date().getFullYear() : Number.parseInt(val, 10))
                    }}
                    className="w-24 px-3 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                  />
                  <input
                    type="number"
                    placeholder="Month"
                    value={selectedMonth || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedMonth(val === "" ? new Date().getMonth() + 1 : Number.parseInt(val, 10))
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

              {bestSellersData && bestSellersData.length > 0 ? (
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
              <div className="bg-white rounded-lg p-4 border border-[#cecabf]/30">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-black mb-2">Filter by Product</label>
                    <select
                      value={incomeProductFilter}
                      onChange={(e) => setIncomeProductFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-[#cecabf]/30 rounded-md bg-white text-black"
                    >
                      <option value="">All Products</option>
                      {incomeProducts.map((product) => (
                        <option key={product} value={product}>
                          {product}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-black mb-2">Filter by Category</label>
                    <select
                      value={incomeCategoryFilter}
                      onChange={(e) => setIncomeCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-[#cecabf]/30 rounded-md bg-white text-black"
                    >
                      <option value="">All Categories</option>
                      {incomeCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleApplyIncomeFilters} className="bg-[#938d7a] hover:bg-[#7a7565] text-white">
                      Apply Filters
                    </Button>
                    <Button
                      onClick={handleResetIncomeFilters}
                      variant="outline"
                      className="border-[#cecabf] text-[#938d7a] hover:bg-[#efece3] bg-transparent"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

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
      {/* Product Selection Dialog */}
      {showProductDialog && ( // Changed from showProductDropdown
        <div
          ref={dropdownRef}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setShowProductDialog(false)} // Changed to showProductDialog
        >
          <div
            className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-black">Select Products (Max 3)</h4>
              <button onClick={() => setShowProductDialog(false)} className="text-[#938d7a] hover:text-black">
                {" "}
                {/* Changed to showProductDialog */}
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by SKU..."
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
            />

            {productSearch ? (
              // Show search results as flat list when searching
              <div className="space-y-2">
                <p className="text-xs text-[#938d7a] mb-2">Search results:</p>
                {getFilteredProducts().length > 0 ? (
                  getFilteredProducts().map((product) => (
                    <button
                      key={product.product_sku}
                      onClick={() => handleProductSelect(product.product_sku)}
                      disabled={!selectedProducts.includes(product.product_sku) && selectedProducts.length >= 3}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedProducts.includes(product.product_sku)
                          ? "bg-[#cecabf] border-[#938d7a] text-black"
                          : "bg-white border-[#efece3] text-black hover:bg-[#f8f5ee]"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.product_sku}</p>
                          <p className="text-xs text-[#938d7a]">{product.product_name || "N/A"}</p>
                        </div>
                        {selectedProducts.includes(product.product_sku) && (
                          <span className="text-xs bg-white px-2 py-1 rounded">Selected</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-[#938d7a] py-4">No products found</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[#938d7a] mb-2">Browse by category:</p>
                {Object.keys(productCategories).length > 0 ? (
                  Object.keys(productCategories).map((category) => (
                    <div key={category} className="border border-[#efece3] rounded-lg overflow-hidden">
                      {/* Category Header - Clickable to expand/collapse */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full text-left px-4 py-3 bg-[#f8f5ee] hover:bg-[#efece3] text-black transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base">{category}</span>
                          <span className="text-xs text-[#938d7a] bg-white px-2 py-0.5 rounded-full">
                            {productCategories[category].length} products
                          </span>
                        </div>
                        <span className="text-[#938d7a]">{expandedCategories.has(category) ? "▼" : "▶"}</span>
                      </button>

                      {/* Products List - Only shown when category is expanded */}
                      {expandedCategories.has(category) && (
                        <div className="bg-white">
                          {productCategories[category].map((product) => (
                            <button
                              key={product.product_sku}
                              onClick={() => handleProductSelect(product.product_sku)}
                              disabled={!selectedProducts.includes(product.product_sku) && selectedProducts.length >= 3}
                              className={`w-full text-left px-6 py-2.5 border-t border-[#efece3] transition-all ${
                                selectedProducts.includes(product.product_sku)
                                  ? "bg-[#cecabf] text-black"
                                  : "bg-white text-black hover:bg-[#f8f5ee]"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{product.product_sku}</p>
                                  <p className="text-xs text-[#938d7a]">{product.product_name || "N/A"}</p>
                                </div>
                                {selectedProducts.includes(product.product_sku) && (
                                  <span className="text-xs bg-white px-2 py-1 rounded">✓</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[#938d7a] py-4">No categories available</p>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#efece3]">
              <p className="text-xs text-[#938d7a]">Selected: {selectedProducts.length}/3 products</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
