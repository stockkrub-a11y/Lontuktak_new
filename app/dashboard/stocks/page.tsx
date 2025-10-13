"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Home,
  Package,
  TrendingUp,
  BookOpen,
  Bell,
  Upload,
  Filter,
  X,
  CloudUpload,
  CheckCircle2,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react"
import { getStockLevels, trainModel } from "@/lib/api"

export default function StocksPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"product" | "sale">("product")
  const [stockItems, setStockItems] = useState<
    Array<{
      id: number
      name: string
      quantity: number
      category: string
      status: string
      statusColor: string
      dotColor: string
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [salesFile, setSalesFile] = useState<File | null>(null)
  const [productFile, setProductFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [backendConnected, setBackendConnected] = useState(true)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    async function fetchStocks() {
      try {
        console.log("[v0] Fetching stock levels...")
        const response = await getStockLevels()
        if (response.success) {
          const mapped = response.data.map((item, index) => ({
            id: index + 1,
            name: item.product_name,
            quantity: item.stock,
            category: item.category || "Uncategorized",
            status: item.status || (item.stock === 0 ? "Out of Stock" : item.stock < 50 ? "Low Stock" : "In Stock"),
            statusColor: item.stock === 0 ? "red" : item.stock < 50 ? "orange" : "green",
            dotColor: item.stock === 0 ? "#ea5457" : item.stock < 50 ? "#eaac54" : "#00a63e",
          }))
          setStockItems(mapped)
          setBackendConnected(true)
          setShowOfflineBanner(false)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch stock levels:", error)
        setBackendConnected(false)
        setShowOfflineBanner(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStocks()
  }, [])

  const openUploadModal = (type: "product" | "sale") => {
    setUploadType(type)
    setIsUploadModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name, "Type:", uploadType)
      if (uploadType === "sale") {
        setSalesFile(file)
      } else {
        setProductFile(file)
      }
    }
  }

  const handleUpload = async () => {
    const currentFile = uploadType === "sale" ? salesFile : productFile

    if (!currentFile) {
      alert(`Please select a ${uploadType === "sale" ? "sales" : "product"} file`)
      return
    }

    console.log("[v0] Starting upload for:", uploadType, "File:", currentFile.name)
    setIsUploading(true)

    try {
      if (!productFile || !salesFile) {
        alert(
          `${uploadType === "product" ? "Product" : "Sales"} file uploaded successfully! Please upload the ${uploadType === "product" ? "sales" : "product"} file to complete the training.`,
        )
        setIsUploadModalOpen(false)
        setIsUploading(false)
        return
      }

      const result = await trainModel(salesFile, productFile)
      alert(`Training successful! ${result.rows_uploaded} rows uploaded.`)
      setIsUploadModalOpen(false)
      setSalesFile(null)
      setProductFile(null)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Upload failed:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

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
                className="w-full pl-10 pr-4 py-2 bg-[#f8f5ee] rounded-lg border-none outline-none text-sm text-black placeholder:text-[#938d7a] focus:ring-2 focus:ring-[#938d7a]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f8f5ee] rounded-lg">
              {backendConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-[#00a63e]" />
                  <span className="text-xs text-[#00a63e] font-medium">Backend Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-[#ea5457]" />
                  <span className="text-xs text-[#ea5457] font-medium">Backend Offline</span>
                </>
              )}
            </div>
            <div className="w-10 h-10 bg-[#ffd700] rounded flex items-center justify-center font-bold text-black text-sm">
              TG
            </div>
            <div>
              <p className="text-sm font-medium text-black">Toogton</p>
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
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard/stocks"
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg text-black font-medium"
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
          {showOfflineBanner && (
            <div className="mb-6 bg-[#fff4e6] border border-[#eaac54] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#eaac54] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-black mb-1">Backend Server Offline</h4>
                  <p className="text-sm text-[#938d7a] mb-2">
                    The backend server is not running. Stock data cannot be loaded from the database.
                  </p>
                  <p className="text-sm text-black font-medium">
                    To start the backend server, run:{" "}
                    <code className="bg-white px-2 py-1 rounded">python scripts/Backend.py</code>
                  </p>
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

          {/* Page Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">Stock Management</h2>
              <p className="text-[#938d7a]">Monitor & manage your inventory levels</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => openUploadModal("product")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#cecabf] rounded-lg hover:bg-[#efece3] transition-colors"
              >
                <Upload className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">Upload Product List</span>
              </button>
              <button
                onClick={() => openUploadModal("sale")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#cecabf] rounded-lg hover:bg-[#efece3] transition-colors"
              >
                <Upload className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">Upload Sale Stock</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30 mb-6">
            <h3 className="text-sm font-medium text-black mb-4">Search & Filters</h3>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#938d7a]" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-[#f8f5ee] rounded-lg border-none outline-none text-sm text-black placeholder:text-[#938d7a]"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#efece3] rounded-lg hover:bg-[#e5e2d8] transition-colors">
                <Filter className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">All Products</span>
              </button>
            </div>
          </div>

          {/* Stock Items List */}
          <div className="bg-white rounded-lg p-6 border border-[#cecabf]/30">
            <h3 className="text-sm font-medium text-black mb-4">
              Stock Items ( {isLoading ? "..." : stockItems.length} )
            </h3>
            {isLoading ? (
              <div className="text-center py-8 text-[#938d7a]">Loading stock data...</div>
            ) : stockItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-[#cecabf] mx-auto mb-3" />
                <p className="text-[#938d7a] mb-2">No stock data available</p>
                <p className="text-sm text-[#938d7a]">
                  {backendConnected
                    ? "Please upload your product list and sales stock files to get started."
                    : "Start the backend server and upload files to see stock data."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-[#f8f5ee] rounded-lg border border-[#cecabf]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.dotColor }} />
                      <div>
                        <h4 className="font-medium text-black">{item.name}</h4>
                        <p className="text-sm text-[#938d7a]">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-white border border-[#cecabf] rounded-full text-xs text-black">
                        {item.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs text-white ${
                          item.statusColor === "green"
                            ? "bg-[#00a63e]"
                            : item.statusColor === "orange"
                              ? "bg-[#eaac54]"
                              : "bg-[#ea5457]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">
                Upload {uploadType === "sale" ? "Sales" : "Product"} File
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#938d7a] hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-[#f8f5ee] rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                {productFile ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00a63e]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#cecabf]" />
                )}
                <p className="text-sm text-black">
                  <strong>Product file:</strong> {productFile ? productFile.name : "Not uploaded"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {salesFile ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00a63e]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#cecabf]" />
                )}
                <p className="text-sm text-black">
                  <strong>Sales file:</strong> {salesFile ? salesFile.name : "Not uploaded"}
                </p>
              </div>
              <p className="text-xs text-[#938d7a] mt-3 pt-3 border-t border-[#cecabf]/30">
                Note: Both files are required to train the model. Upload them in any order.
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#cecabf] rounded-lg p-12 mb-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <CloudUpload className="w-24 h-24 text-[#cecabf]" />
                <p className="text-[#938d7a] text-sm">
                  {(uploadType === "sale" ? salesFile : productFile)?.name || "Drag a file here or click Browse"}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4">
              <label className="flex-1 px-6 py-3 bg-white border border-[#cecabf] rounded-lg text-black font-medium hover:bg-[#f8f5ee] transition-colors text-center cursor-pointer">
                Browse
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
              </label>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-[#cecabf] rounded-lg text-black font-medium hover:bg-[#c5c5c5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
