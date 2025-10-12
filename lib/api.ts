// API configuration and utility functions for backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  console.log("[v0] API Request:", url)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    console.log("[v0] API Response status:", response.status)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }))
      console.error("[v0] API Error response:", error)
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API Success:", data)
    return data
  } catch (error) {
    console.error(`[v0] API Fetch Error for ${endpoint}:`, error)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Cannot connect to backend. Make sure the backend server is running on " + API_BASE_URL)
    }
    throw error
  }
}

export async function trainModel(salesFile: File, productFile?: File) {
  const formData = new FormData()
  formData.append("sales_file", salesFile)
  if (productFile) {
    formData.append("product_file", productFile)
  }

  const response = await fetch(`${API_BASE_URL}/train`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Training failed" }))
    throw new Error(error.detail || "Training failed")
  }

  return await response.json()
}

export async function predictSales(nForecast = 3) {
  return apiFetch<{
    status: string
    forecast_rows: number
    n_forecast: number
    forecast: Array<{
      product_sku: string
      forecast_date: string
      predicted_sales: number
      current_sales: number
      current_date_col: string
    }>
  }>(`/predict?n_forecast=${nForecast}`, { method: "POST" })
}

export async function getHistoricalSales(baseSku: string) {
  return apiFetch<{
    chart: {
      months: string[]
      series: Array<{ size: string; values: number[] }>
    }
    table: Array<{
      date: string
      size: string
      quantity: number
      income: number
    }>
  }>(`/historical?base_sku=${baseSku}`)
}

export async function getPerformanceComparison(skuList: string[]) {
  const params = skuList.map((sku) => `sku_list=${encodeURIComponent(sku)}`).join("&")
  return apiFetch<{
    scatter: Array<{
      item: string
      quantity: number
    }>
  }>(`/performance?${params}`)
}

export async function getBestSellers(year: number, month: number, topN = 10) {
  return apiFetch<{
    table: Array<{
      base_sku: string
      best_size: string
      quantity: number
    }>
  }>(`/best_sellers?year=${year}&month=${month}&top_n=${topN}`)
}

export async function getNotifications() {
  try {
    return await apiFetch<
      Array<{
        Product: string
        Stock: number
        Last_Stock: number
        "Decrease_Rate(%)": number
        Weeks_To_Empty: number
        MinStock: number
        Buffer: number
        Reorder_Qty: number
        Status: string
        Description: string
      }>
    >("/api/notifications")
  } catch (error) {
    console.error("[v0] Failed to fetch notifications:", error)
    // Return mock data if backend is not available
    return []
  }
}

export async function getNotificationDetail(productName: string) {
  return apiFetch<{
    Product: string
    Stock: number
    Last_Stock: number
    "Decrease_Rate(%)": number
    Weeks_To_Empty: number
    MinStock: number
    Buffer: number
    Reorder_Qty: number
    Status: string
    Description: string
  }>(`/api/notifications/${encodeURIComponent(productName)}`)
}

export async function getDashboardAnalytics() {
  try {
    return await apiFetch<{
      success: boolean
      data: {
        total_stock_items: number
        low_stock_alerts: number
        sales_this_month: number
        out_of_stock: number
      }
    }>("/analysis/dashboard")
  } catch (error) {
    console.error("[v0] Failed to fetch dashboard analytics:", error)
    // Return mock data if backend is not available
    return {
      success: false,
      data: {
        total_stock_items: 0,
        low_stock_alerts: 0,
        sales_this_month: 0,
        out_of_stock: 0,
      },
    }
  }
}

export async function getStockLevels() {
  try {
    return await apiFetch<{
      success: boolean
      data: Array<{
        product_name: string
        product_sku: string
        stock: number
        category: string
        status: string
      }>
    }>("/stock/levels")
  } catch (error) {
    console.error("[v0] Failed to fetch stock levels:", error)
    // Return empty data if backend is not available
    return { success: false, data: [] }
  }
}
