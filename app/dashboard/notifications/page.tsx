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
  AlertCircle,
  PackageIcon,
  TrendingDown,
  Shield,
  Target,
  RotateCcw,
  CheckCircle,
  CloudUpload,
} from "lucide-react"

import { getNotifications } from "@/lib/api"

type NotificationStatus = "critical" | "warning" | "safe"

interface Notification {
  id: string
  status: NotificationStatus
  title: string
  product: string
  sku: string
  estimatedTime: string
  recommendUnits: number
  currentStock: number
  decreaseRate: string
  timeToRunOut: string
  minStock: number
  buffer: number
  recommendedRestock: number
}

export default function NotificationsPage() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<NotificationStatus[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await getNotifications()
        const mapped: Notification[] = data.map((item, index) => {
          const status: NotificationStatus =
            item.Status === "Red" ? "critical" : item.Status === "Yellow" ? "warning" : "safe"

          return {
            id: String(index + 1),
            status,
            title: item.Description.includes("หมดสต๊อก")
              ? "Nearly Out of Stock!"
              : item.Description.includes("ลดลงเร็ว")
                ? "Decreasing Rapidly"
                : "Stock is Enough",
            product: item.Product,
            sku: item.Product,
            estimatedTime: `${item.Weeks_To_Empty} weeks`,
            recommendUnits: item.Reorder_Qty,
            currentStock: item.Stock,
            decreaseRate: `${item["Decrease_Rate(%)"]}%/week`,
            timeToRunOut: `${Math.round(item.Weeks_To_Empty * 7)} days`,
            minStock: item.MinStock,
            buffer: item.Buffer,
            recommendedRestock: item.Reorder_Qty,
          }
        })
        setNotifications(mapped)
      } catch (error) {
        console.error("[v0] Failed to fetch notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const filteredNotifications =
    selectedStatuses.length > 0 ? notifications.filter((n) => selectedStatuses.includes(n.status)) : notifications

  const getStatusColor = (status: NotificationStatus) => {
    switch (status) {
      case "critical":
        return "border-l-[#ea5457]"
      case "warning":
        return "border-l-[#eaac54]"
      case "safe":
        return "border-l-[#00a63e]"
    }
  }

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-[#ea5457]" />
      case "warning":
        return <PackageIcon className="w-5 h-5 text-[#eaac54]" />
      case "safe":
        return <CheckCircle className="w-5 h-5 text-[#00a63e]" />
    }
  }

  const getStatusTextColor = (status: NotificationStatus) => {
    switch (status) {
      case "critical":
        return "text-[#ea5457]"
      case "warning":
        return "text-[#eaac54]"
      case "safe":
        return "text-[#00a63e]"
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Status",
      "Product",
      "SKU",
      "Current Stock",
      "Decrease Rate",
      "Time to Run Out",
      "Min Stock",
      "Buffer",
      "Recommended Restock",
    ]
    const rows = filteredNotifications.map((n) => [
      n.status,
      n.product,
      n.sku,
      n.currentStock,
      n.decreaseRate,
      n.timeToRunOut,
      n.minStock,
      n.buffer,
      n.recommendedRestock,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "notifications.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleStatus = (status: NotificationStatus) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name)
      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload")
      return
    }

    console.log("[v0] Uploading file:", uploadFile.name)
    // TODO: Implement actual upload logic when backend endpoint is ready
    alert("Upload functionality will be implemented when backend endpoint is ready")
    setIsUploadModalOpen(false)
    setUploadFile(null)
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
            <div className="w-10 h-10 bg-[#ffd700] rounded flex items-center justify-center font-bold text-black text-sm">
              TG
            </div>
            <div>
              <p className="text-sm font-medium text-black">Toogleton</p>
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
              className="flex items-center gap-3 px-3 py-2.5 text-[#1e1e1e] hover:bg-white/50 rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Analysis</span>
            </Link>
            <Link
              href="/dashboard/notifications"
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg text-black font-medium"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">Notifications</h2>
              <p className="text-[#938d7a]">Stay updated with your inventory alerts</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[#cecabf] hover:bg-[#efece3] transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload</span>
              </button>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[#cecabf] hover:bg-[#efece3] transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter Notifications</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="text-center py-8 text-[#938d7a]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-[#938d7a]">No notifications available.</div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => setSelectedNotification(notification)}
                  className={`w-full bg-white rounded-lg p-6 border-l-4 ${getStatusColor(
                    notification.status,
                  )} hover:shadow-md transition-shadow text-left relative`}
                >
                  <div className="flex items-start gap-4">
                    {getStatusIcon(notification.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black mb-1">
                        <span className={getStatusTextColor(notification.status)}>{notification.title}</span> -{" "}
                        {notification.product}
                      </h3>
                      <p className="text-sm text-[#938d7a]">
                        Estimated to run out in{" "}
                        <span className={getStatusTextColor(notification.status)}>{notification.estimatedTime}</span>
                        {notification.recommendUnits > 0 && (
                          <>
                            {" "}
                            - Recommend Restocking{" "}
                            <span className={getStatusTextColor(notification.status)}>
                              {notification.recommendUnits} Units
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-[#547fff] rounded-full" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-black">
                    {selectedNotification.product} || {selectedNotification.sku}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedNotification.status === "critical"
                        ? "bg-[#ffe2e2] text-[#9f0712]"
                        : selectedNotification.status === "warning"
                          ? "bg-[#fff4e6] text-[#eaac54]"
                          : "bg-[#ebf9f3] text-[#00a63e]"
                    }`}
                  >
                    {selectedNotification.status === "critical"
                      ? "Critical"
                      : selectedNotification.status === "warning"
                        ? "Warning"
                        : "Safe"}
                  </span>
                </div>
                <p className="text-sm text-[#938d7a]">Inventory alert • Updated 5m ago</p>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="text-[#938d7a] hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Current Stock</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.currentStock}</p>
                  <PackageIcon className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">units remaining</p>
              </div>

              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Decrease Rate</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.decreaseRate}</p>
                  <TrendingDown className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">trending down</p>
              </div>

              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Time to Run Out</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.timeToRunOut}</p>
                  <AlertCircle className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">at current rate</p>
              </div>

              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Min Stock</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.minStock}</p>
                  <Shield className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">threshold</p>
              </div>

              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Buffer</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.buffer}</p>
                  <Target className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">safety stock</p>
              </div>

              <div className="border border-[#cecabf] rounded-lg p-4">
                <p className="text-xs text-[#938d7a] mb-2">Recommended restock</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-black">{selectedNotification.recommendedRestock}</p>
                  <RotateCcw className="w-8 h-8 text-[#938d7a]" />
                </div>
                <p className="text-xs text-[#938d7a] mt-1">units suggested</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Filters</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-[#938d7a] hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Range */}
            <div className="mb-6">
              <p className="text-sm font-medium text-black mb-3">Time Range</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-[#efece3] rounded-lg text-sm hover:bg-[#cecabf] transition-colors">
                  Last 7 days
                </button>
                <button className="px-4 py-2 bg-[#efece3] rounded-lg text-sm hover:bg-[#cecabf] transition-colors">
                  Last 30 days
                </button>
                <button className="px-4 py-2 bg-[#efece3] rounded-lg text-sm hover:bg-[#cecabf] transition-colors">
                  Custom
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Product/SKU Search */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Product / SKU</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#938d7a]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-[#cecabf] rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Category</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Long pants</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Men Boxers</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Women Boxers</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>T Shirt</span>
                  </label>
                </div>
              </div>

              {/* Size */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Size</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Small</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Medium</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Large</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Extra Large</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Inventory Status */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Inventory Status</p>
                <div className="space-y-2">
                  <button
                    onClick={() => toggleStatus("critical")}
                    className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedStatuses.includes("critical")
                        ? "bg-[#ffe2e2] text-[#9f0712] ring-2 ring-[#ea5457]"
                        : "bg-[#ffe2e2] text-[#9f0712] hover:ring-2 hover:ring-[#ea5457]"
                    }`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => toggleStatus("warning")}
                    className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedStatuses.includes("warning")
                        ? "bg-[#fff4e6] text-[#eaac54] ring-2 ring-[#eaac54]"
                        : "bg-[#fff4e6] text-[#eaac54] hover:ring-2 hover:ring-[#eaac54]"
                    }`}
                  >
                    Warning
                  </button>
                  <button
                    onClick={() => toggleStatus("safe")}
                    className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
                      selectedStatuses.includes("safe")
                        ? "bg-[#ebf9f3] text-[#00a63e] ring-2 ring-[#00a63e]"
                        : "bg-[#ebf9f3] text-[#00a63e] hover:ring-2 hover:ring-[#00a63e]"
                    }`}
                  >
                    Safe
                  </button>
                </div>
              </div>

              {/* Blank */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Blank</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="-"
                    className="w-full px-4 py-2 border border-[#cecabf] rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-[#cecabf] rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="-"
                    className="w-full px-4 py-2 border border-[#cecabf] rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="1000"
                    className="w-full px-4 py-2 border border-[#cecabf] rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-sm font-medium text-black mb-3">Details</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>SKU</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Last week stock</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Min stock</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStatuses([])}
                className="px-4 py-2 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors"
              >
                Reset
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-[#cecabf] rounded-lg hover:bg-[#f8f5ee] transition-colors"
              >
                Export Excel
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 bg-[#cecabf] text-black rounded-lg hover:bg-[#938d7a] hover:text-white transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Upload</h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setUploadFile(null)
                }}
                className="text-[#938d7a] hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#cecabf] rounded-lg p-12 mb-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <CloudUpload className="w-24 h-24 text-[#cecabf]" />
                <p className="text-[#938d7a] text-sm">
                  {uploadFile ? uploadFile.name : "Drag a file here or click Browse"}
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
                className="flex-1 px-6 py-3 bg-[#cecabf] rounded-lg text-black font-medium hover:bg-[#c5c5c5] transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
