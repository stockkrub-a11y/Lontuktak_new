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

// Sample data for Historical Sales
const historicalSalesData = [
  { month: "Jan", S: 3, M: 5, L: 2, XL: 1 },
  { month: "Feb", S: 4, M: 3, L: 6, XL: 2 },
  { month: "Mar", S: 2, M: 6, L: 4, XL: 3 },
  { month: "Apr", S: 5, M: 4, L: 3, XL: 2 },
  { month: "May", S: 3, M: 5, L: 4, XL: 1 },
  { month: "Jun", S: 4, M: 6, L: 5, XL: 3 },
  { month: "Jul", S: 3, M: 4, L: 3, XL: 2 },
  { month: "Aug", S: 6, M: 5, L: 4, XL: 3 },
  { month: "Sep", S: 4, M: 5, L: 3, XL: 2 },
  { month: "Oct", S: 5, M: 6, L: 4, XL: 3 },
  { month: "Nov", S: 6, M: 7, L: 5, XL: 4 },
  { month: "Dec", S: 4, M: 5, L: 3, XL: 2 },
]

// Sample data for Performance Comparison
const performanceData = {
  "Shinchan Boxers": [
    { month: 1, value: 120 },
    { month: 2, value: 150 },
    { month: 3, value: 110 },
    { month: 4, value: 105 },
    { month: 5, value: 95 },
    { month: 6, value: 100 },
  ],
  "Deep Sleep": [
    { month: 1, value: 100 },
    { month: 2, value: 115 },
    { month: 3, value: 105 },
    { month: 4, value: 145 },
    { month: 5, value: 95 },
    { month: 6, value: 130 },
  ],
  "Long Pants": [
    { month: 1, value: 90 },
    { month: 2, value: 110 },
    { month: 3, value: 100 },
    { month: 4, value: 125 },
    { month: 5, value: 140 },
    { month: 6, value: 95 },
  ],
}

// Sample data for Best Sellers
const bestSellersData = [
  { rank: 1, name: "asdasd", size: "M", quantity: 1245, income: 730 },
  { rank: 2, name: "fdsfd", size: "L", quantity: 892, income: 730 },
  { rank: 3, name: "sfds", size: "M", quantity: 567, income: 730 },
  { rank: 4, name: "sfds", size: "L", quantity: 445, income: 730 },
  { rank: 5, name: "sdf", size: "S", quantity: 398, income: 730 },
  { rank: 6, name: "sdfds", size: "M", quantity: 356, income: 730 },
  { rank: 7, name: "sdff", size: "M", quantity: 289, income: 730 },
  { rank: 8, name: "sdfsdf", size: "L", quantity: 245, income: 730 },
  { rank: 9, name: "sdfsd", size: "S", quantity: 198, income: 730 },
  { rank: 10, name: "sdfsdf", size: "XL", quantity: 156, income: 730 },
]

// Sample data for Total Income
const totalIncomeData = [
  { month: 1, income: 58000 },
  { month: 2, income: 65000 },
  { month: 3, income: 62000 },
  { month: 4, income: 78000 },
  { month: 5, income: 85000 },
  { month: 6, income: 92000 },
  { month: 7, income: 105000 },
  { month: 8, income: 125000 },
  { month: 9, income: 145000 },
  { month: 10, income: 165000 },
  { month: 11, income: 185000 },
  { month: 12, income: 205000 },
]

const incomeTableData = [
  { sku: "asdasd", monthsActive: 12, totalIncome: 730, avgMonthly: 730 },
  { sku: "asd", monthsActive: 10, totalIncome: 730, avgMonthly: 730 },
  { sku: "sad", monthsActive: 12, totalIncome: 730, avgMonthly: 730 },
]

const allProducts = ["Shinchan Boxers", "Deep Sleep", "Long Pants", "Basic T-Shirt", "Premium Shirt"]

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<"historical" | "performance" | "bestsellers" | "income">("historical")
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["Shinchan Boxers", "Deep Sleep", "Long Pants"])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const getFilteredPerformanceData = () => {
    const filtered: any = {}
    selectedProducts.forEach((product) => {
      if (performanceData[product as keyof typeof performanceData]) {
        filtered[product] = performanceData[product as keyof typeof performanceData]
      }
    })
    return filtered
  }

  const filteredPerformanceData = getFilteredPerformanceData()

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
              <h3 className="text-xl font-bold text-black mb-6">Historical Sales</h3>

              <div className="mb-8">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={historicalSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                    <XAxis dataKey="month" stroke="#938d7a" />
                    <YAxis stroke="#938d7a" />
                    <Legend />
                    <Bar dataKey="S" stackId="a" fill="#d4cfc4" name="Size S" />
                    <Bar dataKey="M" stackId="a" fill="#b8b3a8" name="Size M" />
                    <Bar dataKey="L" stackId="a" fill="#efece3" name="Size L" />
                    <Bar dataKey="XL" stackId="a" fill="#e8e4d9" name="Size XL" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#efece3]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-black">Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-black">S</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-black">M</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-black">L</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-black">XL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#efece3]">
                      <td className="py-3 px-4 text-sm text-black">2025-02-05</td>
                      <td className="py-3 px-4 text-sm text-black text-center">3</td>
                      <td className="py-3 px-4 text-sm text-black text-center">5</td>
                      <td className="py-3 px-4 text-sm text-black text-center">2</td>
                      <td className="py-3 px-4 text-sm text-black text-center">1</td>
                    </tr>
                    <tr className="border-b border-[#efece3]">
                      <td className="py-3 px-4 text-sm text-black">2025-03-12</td>
                      <td className="py-3 px-4 text-sm text-black text-center">4</td>
                      <td className="py-3 px-4 text-sm text-black text-center">3</td>
                      <td className="py-3 px-4 text-sm text-black text-center">6</td>
                      <td className="py-3 px-4 text-sm text-black text-center">2</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm text-black">2025-04-08</td>
                      <td className="py-3 px-4 text-sm text-black text-center">2</td>
                      <td className="py-3 px-4 text-sm text-black text-center">6</td>
                      <td className="py-3 px-4 text-sm text-black text-center">4</td>
                      <td className="py-3 px-4 text-sm text-black text-center">3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Comparison View */}
          {activeTab === "performance" && (
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">Performance Comparison (Top 3 SKUs)</h3>
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

                  {showProductDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#cecabf] rounded-lg shadow-lg z-10">
                      <div className="p-3 border-b border-[#efece3]">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full px-3 py-2 bg-[#f8f5ee] rounded border-none outline-none text-sm"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => {
                            const isSelected = selectedProducts.includes(product)
                            const canSelect = selectedProducts.length < 3 || isSelected

                            return (
                              <button
                                key={product}
                                onClick={() => {
                                  if (canSelect || isSelected) {
                                    toggleProduct(product)
                                  }
                                }}
                                disabled={!canSelect && !isSelected}
                                className={`w-full text-left px-4 py-3 hover:bg-[#f8f5ee] transition-colors ${
                                  isSelected ? "bg-[#efece3] font-medium" : ""
                                } ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-black">{product}</span>
                                  {isSelected && <span className="text-xs text-green-600">✓</span>}
                                </div>
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-[#938d7a] text-center">No products found</div>
                        )}
                      </div>
                      <div className="p-3 border-t border-[#efece3] text-xs text-[#938d7a]">
                        {selectedProducts.length}/3 products selected
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                    <XAxis type="number" dataKey="month" name="Month" domain={[0, 7]} stroke="#938d7a" />
                    <YAxis type="number" dataKey="value" name="Value" domain={[0, 250]} stroke="#938d7a" />
                    {selectedProducts.includes("Shinchan Boxers") && (
                      <Scatter name="Shinchan Boxers" data={performanceData["Shinchan Boxers"]} fill="#ef4444" />
                    )}
                    {selectedProducts.includes("Deep Sleep") && (
                      <Scatter name="Deep Sleep" data={performanceData["Deep Sleep"]} fill="#10b981" />
                    )}
                    {selectedProducts.includes("Long Pants") && (
                      <Scatter name="Long Pants" data={performanceData["Long Pants"]} fill="#f59e0b" />
                    )}
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-black">Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.includes("Shinchan Boxers") && (
                      <tr className="border-b border-[#efece3]">
                        <td className="py-3 px-4 text-sm text-[#ef4444] font-medium">sdakn</td>
                        <td className="py-3 px-4 text-sm text-black">Shinchan Boxers</td>
                        <td className="py-3 px-4 text-sm text-black text-right">1245</td>
                        <td className="py-3 px-4 text-sm text-black text-right">฿730</td>
                      </tr>
                    )}
                    {selectedProducts.includes("Deep Sleep") && (
                      <tr className="border-b border-[#efece3]">
                        <td className="py-3 px-4 text-sm text-[#10b981] font-medium">sdakn</td>
                        <td className="py-3 px-4 text-sm text-black">Deep Sleep</td>
                        <td className="py-3 px-4 text-sm text-black text-right">892</td>
                        <td className="py-3 px-4 text-sm text-black text-right">฿730</td>
                      </tr>
                    )}
                    {selectedProducts.includes("Long Pants") && (
                      <tr>
                        <td className="py-3 px-4 text-sm text-[#f59e0b] font-medium">JN003</td>
                        <td className="py-3 px-4 text-sm text-black">Long Pants</td>
                        <td className="py-3 px-4 text-sm text-black text-right">567</td>
                        <td className="py-3 px-4 text-sm text-black text-right">฿730</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Best Sellers View */}
          {activeTab === "bestsellers" && (
            <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
              <h3 className="text-xl font-bold text-black mb-6">Top 10 Best Sellers</h3>

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
                          <p className="text-sm text-[#938d7a]">Size: {item.size}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#938d7a]">Quantity</p>
                          <p className="font-bold text-black">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#938d7a]">Income</p>
                          <p className="font-bold text-black">฿{item.income}</p>
                        </div>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="bg-[#938d7a] h-2 rounded-full"
                          style={{ width: `${(item.quantity / 1245) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Income View */}
          {activeTab === "income" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-6 border border-blue-200">
                  <p className="text-3xl font-bold text-blue-600 mb-2">฿632,000</p>
                  <p className="text-sm text-blue-800 font-medium">Total Annual Income</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-6 border border-green-200">
                  <p className="text-3xl font-bold text-green-600 mb-2">฿52,667</p>
                  <p className="text-sm text-green-800 font-medium">Average Monthly Income</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-6 border border-purple-200">
                  <p className="text-3xl font-bold text-purple-600 mb-2">+240%</p>
                  <p className="text-sm text-purple-800 font-medium">Annual Growth Rate</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
                <h3 className="text-xl font-bold text-black mb-6">Total Income Growth</h3>

                <div className="mb-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={totalIncomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#efece3" />
                      <XAxis
                        dataKey="month"
                        stroke="#938d7a"
                        label={{ value: "Months Active", position: "insideBottom", offset: -5 }}
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
                        <th className="text-center py-3 px-4 text-sm font-medium text-black">Months Active</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-black">Total Income</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-black">Avg Monthly Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeTableData.map((item, index) => (
                        <tr key={index} className="border-b border-[#efece3]">
                          <td className="py-3 px-4 text-sm text-black">{item.sku}</td>
                          <td className="py-3 px-4 text-sm text-black text-center">{item.monthsActive}</td>
                          <td className="py-3 px-4 text-sm text-black text-right">฿{item.totalIncome}</td>
                          <td className="py-3 px-4 text-sm text-black text-right">฿{item.avgMonthly}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
