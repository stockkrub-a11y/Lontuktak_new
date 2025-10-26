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
  Line, // Added Line import for line chart
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  BarChart,
  Legend,
  Tooltip, // Added Tooltip import
} from "recharts"
import {
  getAnalysisHistoricalSales,
  getAnalysisPerformance,
  getAnalysisBestSellers,
  getAnalysisTotalIncome,
  getAnalysisBaseSKUs,
  getAnalysisPerformanceProducts, // Added import for performance products
  getSearchSuggestions, // Added import for search suggestions
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
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ value: string; type: string; label: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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

  const CustomHistoricalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            border: "2px solid #938d7a",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxWidth: "300px",
          }}
        >
          <p
            style={{
              color: "#938d7a",
              fontWeight: "600",
              marginBottom: "8px",
              fontSize: "14px",
              wordWrap: "break-word",
              whiteSpace: "normal",
            }}
          >
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={`item-${index}`}
              style={{
                color: "#1e1e1e",
                fontSize: "14px",
                padding: "4px 0",
              }}
            >
              <span style={{ fontWeight: "600" }}>{entry.name}:</span> {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

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

  const fetchSearchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 1) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const data = await getSearchSuggestions(searchTerm)

      if (data.success && data.suggestions.length > 0) {
        setSearchSuggestions(data.suggestions)
        setShowSuggestions(true)
      } else {
        setSearchSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Error fetching search suggestions:", error)
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSkuInputChange = (value: string) => {
    setSkuSearch(value)
    setSelectedBaseSku(value)
    fetchSearchSuggestions(value)
  }

  const handleSelectSuggestion = (value: string) => {
    setSelectedBaseSku(value)
    setSkuSearch(value)
    setShowSuggestions(false)
    setSearchSuggestions([])
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
    console.log("[v0] Compare button clicked")
    console.log("[v0] Selected products:", selectedProducts)

    if (selectedProducts.length === 0) {
      console.log("[v0] No products selected, returning early")
      alert("Please select at least one product to compare")
      return
    }

    setIsLoading(true)
    console.log("[v0] Starting API call to compare products...")

    try {
      const data = await getAnalysisPerformance(selectedProducts)
      console.log("[v0] API response received:", data)

      if (data.success) {
        console.log("[v0] Comparison successful, setting performance data")
        console.log("[v0] Chart data:", data.chart_data)
        console.log("[v0] Table data:", data.table_data)

        const transformedChartData = data.chart_data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const currentYear = new Date().getFullYear()

        // Transform each product's data to include formatted month labels
        Object.keys(transformedChartData).forEach((sku) => {
          transformedChartData[sku] = transformedChartData[sku].map((point: any) => ({
            ...point,
            monthLabel:
              point.month >= 1 && point.month <= 12
                ? `${monthNames[point.month - 1]} ${currentYear}`
                : `Month ${point.month}`,
          }))
        })

        setPerformanceData({ ...data, chart_data: transformedChartData })
        setBackendConnected(true)
        setShowOfflineBanner(false)
      } else {
        console.log("[v0] API returned success=false:", data.message)
        setPerformanceData({ chart_data: {}, table_data: [], message: data.message })
        setBackendConnected(true)
        alert(data.message || "Failed to load comparison data")
      }
    } catch (error) {
      console.error("[v0] Error loading performance comparison:", error)
      setBackendConnected(false)
      setShowOfflineBanner(true)
      setPerformanceData(null)
      alert("Failed to connect to backend. Please make sure the backend server is running.")
    } finally {
      setIsLoading(false)
      console.log("[v0] Compare operation completed")
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

  const handleResetProducts = () => {
    setSelectedProducts([])
    setPerformanceData(null)
  }

  const handleCompare = () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to compare")
      return
    }
    setShowProductDialog(false)
    loadPerformanceComparison()
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
        setShowSuggestions(false) // Changed from setShowSkuDropdown
      }
    }

    if (showSuggestions) {
      // Changed from showSkuDropdown
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSuggestions]) // Changed from showSkuDropdown

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
    <div className="min-h-screen bg-[#f5f3ed]">
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
          <div>
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
                        onFocus={() => skuSearch.trim() && searchSuggestions.length > 0 && setShowSuggestions(true)} // Changed from showSkuDropdown
                        className="w-80 px-4 py-2 rounded-lg border border-[#cecabf] text-sm text-black outline-none focus:border-[#938d7a]"
                      />
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#cecabf] rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                          {searchSuggestions.map((suggestion, idx) => (
                            <button
                              key={`${suggestion.type}-${suggestion.value}-${idx}`}
                              onClick={() => handleSelectSuggestion(suggestion.value)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8f5ee] transition-colors border-b border-[#efece3] last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-black font-medium">{suggestion.value}</p>
                                  {suggestion.label && suggestion.label !== suggestion.value && (
                                    <p className="text-xs text-[#938d7a] mt-0.5">{suggestion.label}</p>
                                  )}
                                </div>
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                    suggestion.type === "SKU"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {suggestion.type}
                                </span>
                              </div>
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
                    <p className="text-xs mt-2">
                      SKU: Shows sales over time | Category: Shows all products in category
                    </p>
                  </div>
                )}

                {historicalData && historicalData.chart_data.length > 0 ? (
                  <>
                    <div className="mb-8">
                      <ResponsiveContainer width="100%" height={400}>
                        {historicalData.search_type === "sku" ? (
                          // Line chart for SKU search (sales over time)
                          <LineChart data={historicalData.chart_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                            <XAxis
                              dataKey="month"
                              stroke="#938d7a"
                              label={{ value: "Month", position: "insideBottom", offset: -5, fill: "#938d7a" }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis
                              stroke="#938d7a"
                              label={{ value: "Quantity Sold", angle: -90, position: "insideLeft", fill: "#938d7a" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "2px solid #938d7a",
                                borderRadius: "8px",
                                padding: "12px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                              }}
                              labelStyle={{
                                color: "#938d7a",
                                fontWeight: "600",
                                marginBottom: "8px",
                                fontSize: "14px",
                              }}
                              itemStyle={{
                                color: "#1e1e1e",
                                fontSize: "14px",
                                padding: "4px 0",
                              }}
                              formatter={(value: any) => [value.toLocaleString(), "Quantity Sold"]}
                              cursor={{ stroke: "#938d7a", strokeWidth: 1, strokeDasharray: "5 5" }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="quantity"
                              stroke="#938d7a"
                              strokeWidth={3}
                              name="Quantity Sold"
                              dot={{ fill: "#938d7a", r: 6 }}
                              activeDot={{ r: 10, fill: "#938d7a", stroke: "white", strokeWidth: 3 }}
                            />
                          </LineChart>
                        ) : (
                          // Bar chart for category search (products comparison)
                          <BarChart data={historicalData.chart_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                            <XAxis
                              dataKey="product_name"
                              stroke="#938d7a"
                              label={{ value: "Product Name", position: "insideBottom", offset: -5, fill: "#938d7a" }}
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis
                              stroke="#938d7a"
                              label={{ value: "Stock Level", angle: -90, position: "insideLeft", fill: "#938d7a" }}
                            />
                            <Tooltip
                              content={<CustomHistoricalTooltip />}
                              cursor={{ fill: "rgba(147, 141, 122, 0.1)" }}
                            />
                            <Legend />
                            <Bar dataKey="stock_level" fill="#938d7a" name="Stock Level" barSize={80} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#efece3]">
                            <th className="text-left py-3 px-4 text-sm font-medium text-black">SKU</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-black">Product Name</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-black">
                              {historicalData.search_type === "sku" ? "Total Quantity Sold" : "Stock Level"}
                            </th>
                            {historicalData.search_type === "category" && (
                              <>
                                <th className="text-center py-3 px-4 text-sm font-medium text-black">Category</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-black">Status</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {historicalData.table_data.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-[#efece3]">
                              <td className="py-3 px-4 text-sm text-black font-medium">{row.product_sku}</td>
                              <td className="py-3 px-4 text-sm text-black">{row.product_name}</td>
                              <td className="py-3 px-4 text-sm text-black text-center">
                                {historicalData.search_type === "sku" ? row.total_quantity : row.stock_level}
                              </td>
                              {historicalData.search_type === "category" && (
                                <>
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
                                </>
                              )}
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
                    <button
                      onClick={() => setShowProductDialog(true)}
                      className="px-4 py-2 rounded-lg bg-[#cecabf] hover:bg-[#b8b3a8] text-black text-sm font-medium flex items-center gap-2 transition-all"
                    >
                      <Package2 className="w-4 h-4" />
                      Select Products
                    </button>
                    {selectedProducts.length > 0 && (
                      <>
                        <button
                          onClick={loadPerformanceComparison}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg bg-[#938d7a] hover:bg-[#7a7565] text-white text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <GitCompare className="w-4 h-4" />
                          {isLoading ? "Comparing..." : "Compare"}
                        </button>
                        <button
                          onClick={handleResetProducts}
                          className="px-4 py-2 rounded-lg bg-white border border-[#cecabf] hover:bg-[#f8f5ee] text-[#938d7a] text-sm font-medium transition-colors"
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mb-4 p-3 bg-[#f8f5ee] rounded-lg">
                    <p className="text-xs text-[#938d7a] mb-2">Selected Products:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((sku) => (
                        <span
                          key={sku}
                          className="px-3 py-1 bg-white rounded-full text-sm text-black border border-[#cecabf]"
                        >
                          {sku}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {performanceData && performanceData.table_data.length > 0 ? (
                  <>
                    <div className="mb-8">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={(() => {
                            // Combine all products' data into a single array with all months
                            const allMonths = new Set<number>()
                            Object.values(performanceData.chart_data).forEach((productData: any) => {
                              productData.forEach((point: any) => allMonths.add(point.month))
                            })

                            // Create a data point for each month
                            return Array.from(allMonths)
                              .sort((a, b) => a - b)
                              .map((month) => {
                                const monthNames = [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec",
                                ]
                                const currentYear = new Date().getFullYear()
                                const dataPoint: any = {
                                  month,
                                  monthLabel:
                                    month >= 1 && month <= 12
                                      ? `${monthNames[month - 1]} ${currentYear}`
                                      : `Month ${month}`,
                                }

                                // Add each product's value for this month
                                Object.entries(performanceData.chart_data).forEach(([sku, data]: [string, any]) => {
                                  const point = data.find((p: any) => p.month === month)
                                  dataPoint[sku] = point ? point.value : null
                                })

                                return dataPoint
                              })
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                          <XAxis
                            dataKey="monthLabel"
                            stroke="#938d7a"
                            label={{ value: "Month", position: "insideBottom", offset: -5, fill: "#938d7a" }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            stroke="#938d7a"
                            label={{ value: "Quantity", angle: -90, position: "insideLeft", fill: "#938d7a" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "2px solid #938d7a",
                              borderRadius: "8px",
                              padding: "12px",
                              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          {Object.keys(performanceData.chart_data).map((sku, idx) => (
                            <Line
                              key={sku}
                              type="monotone"
                              dataKey={sku}
                              stroke={["#ef4444", "#10b981", "#f59e0b"][idx % 3]}
                              strokeWidth={2}
                              name={sku}
                              dot={{ fill: ["#ef4444", "#10b981", "#f59e0b"][idx % 3], r: 5 }}
                              activeDot={{ r: 8, stroke: "white", strokeWidth: 2 }}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
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
                        ? "Select products using the 'Select Products' button above"
                        : "Click the 'Compare' button above to view performance data"}
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
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-black">Total Income Growth</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          Line Chart View
                        </span>
                      </div>

                      <div className="mb-8">
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart
                            data={totalIncomeData.chart_data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                            <XAxis
                              dataKey="month"
                              stroke="#938d7a"
                              label={{ value: "Month", position: "insideBottom", offset: -5 }}
                            />
                            <YAxis
                              stroke="#938d7a"
                              label={{ value: "Income (฿)", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "2px solid #938d7a",
                                borderRadius: "8px",
                                padding: "12px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                              }}
                              labelStyle={{
                                color: "#938d7a",
                                fontWeight: "600",
                                marginBottom: "4px",
                                fontSize: "14px",
                              }}
                              itemStyle={{
                                color: "#1e1e1e",
                                fontSize: "14px",
                              }}
                              formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, "Total Income"]}
                              labelFormatter={(label) => `Month: ${label}`}
                              cursor={{ stroke: "#938d7a", strokeWidth: 1, strokeDasharray: "5 5" }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total_income"
                              stroke="#938d7a"
                              strokeWidth={3}
                              name="Total Income (฿)"
                              dot={{ fill: "#938d7a", r: 6 }}
                              activeDot={{ r: 10, fill: "#938d7a", stroke: "white", strokeWidth: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#efece3]">
                              <th className="text-left py-3 px-4 text-sm font-medium text-black">Product</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-black">
                                Avg Monthly Revenue
                              </th>
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
          </div>
        </main>
      </div>

      {/* Product Selection Dialog */}
      {showProductDialog && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setShowProductDialog(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-black">Select Products (Max 3)</h4>
              <button onClick={() => setShowProductDialog(false)} className="text-[#938d7a] hover:text-black">
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
                          <span className="text-xs bg-white px-2 py-1 rounded">✓</span>
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
              <p className="text-xs text-[#938d7a] mb-2">Selected: {selectedProducts.length}/3 products</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowProductDialog(false)
                    if (selectedProducts.length > 0) {
                      loadPerformanceComparison()
                    }
                  }}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#938d7a] hover:bg-[#7a7565] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare ({selectedProducts.length} selected)
                </button>
                <button
                  onClick={() => setShowProductDialog(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#cecabf] hover:bg-[#f8f5ee] text-[#938d7a] text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
