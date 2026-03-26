import type { NewsItem, NewsFilter, PaginatedResult, NewsSource } from '@/types/news'

// ─── API 基础配置 ───
// Supabase Edge Functions URL（生产环境）或本地开发
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const API_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/api`
  : (import.meta.env.VITE_API_URL || '')

// 配图池
const categoryImages: Record<string, string> = {
  '污染防治': '/images/news-1.png',
  '生态保护': '/images/news-1.png',
  '绿色发展': '/images/news-2.png',
  '科技创新': '/images/news-2.png',
  '环境监测': '/images/news-3.png',
  '国际合作': '/images/news-3.png',
}
const defaultImages = ['/images/news-1.png', '/images/news-2.png', '/images/news-3.png']

function assignImage(item: { category: string }, i: number): string {
  return categoryImages[item.category] || defaultImages[i % 3]
}

// ─── API 响应类型 ───

interface ApiSource {
  id: string
  name: string
  short_name: string
  region: string
  url: string
  category: string
}

interface ApiNewsItem {
  id: string
  title: string
  url: string
  date: string | null
  summary: string | null
  // Supabase Edge Function 返回扁平化字段
  source_id: string
  source_name?: string
  source_short_name?: string
  region?: string
  source_url?: string
  // FastAPI 返回嵌套对象（本地开发）
  source?: ApiSource
  category: string
  tags: string[]
  merged: boolean
  view_count: number
  created_at: string | null
}

// Supabase Edge Function 的列表响应（字段名与 FastAPI 不同）
interface ApiListResponse {
  data?: ApiNewsItem[]
  items?: ApiNewsItem[]
  total: number
  page: number
  pageSize?: number
  page_size?: number
  totalPages?: number
  total_pages?: number
}

interface ApiStatsResponse {
  total_sources: number
  total_news: number
  today_news: number
  provinces: number
  categories: string[]
  sources: ApiSource[]
}

// ─── 转换函数：API 格式 → 前端格式 ───

function mapSource(s: ApiSource): NewsSource {
  return {
    id: s.id,
    name: s.name,
    shortName: s.short_name,
    region: s.region,
    url: s.url,
    category: s.category as NewsSource['category'],
  }
}

function mapNewsItem(item: ApiNewsItem, index: number): NewsItem {
  // 兼容 Supabase 扁平化格式和 FastAPI 嵌套格式
  const source: NewsSource = item.source
    ? mapSource(item.source)
    : {
        id: item.source_id || '',
        name: item.source_name || '',
        shortName: item.source_short_name || '',
        region: item.region || '',
        url: item.source_url || '',
        category: 'province' as NewsSource['category'],
      }
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || item.title,
    content: item.summary
      ? `<p>${item.summary}</p><p>更多详情请查看原文链接。</p>`
      : `<p>${item.title}</p><p>更多详情请查看原文链接。</p>`,
    source,
    publishDate: item.date || '2026-03-26',
    category: item.category || '环保资讯',
    imageUrl: assignImage(item, index),
    originalUrl: item.url,
    tags: item.tags?.length ? item.tags : ['环保资讯'],
    viewCount: item.view_count || 0,
    merged: item.merged || false,
  }
}

// ─── 通用请求函数 ───

const isSupabase = !!SUPABASE_URL

async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const base = API_BASE || window.location.origin
  // Supabase 模式: API_BASE 已包含 /functions/v1/api，去掉 path 中的 /api 前缀
  // 本地模式: 保持 /api/xxx 路径
  const fullPath = isSupabase ? path.replace(/^\/api/, '') : path
  const url = new URL(fullPath, base)
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val))
      }
    })
  }
  const resp = await fetch(url.toString())
  if (!resp.ok) throw new Error(`API Error: ${resp.status} ${resp.statusText}`)
  return resp.json()
}

// ─── 公开 API ───

const categories = ['政策法规', '污染防治', '生态保护', '环境监测', '绿色发展', '督察执法', '国际合作', '科技创新', '环保资讯']

export async function fetchNews(filter: NewsFilter): Promise<PaginatedResult<NewsItem>> {
  const data = await apiFetch<ApiListResponse>('/api/news', {
    region: filter.region,
    source: filter.source,
    category: filter.category,
    keyword: filter.keyword,
    date_start: filter.dateRange?.start,
    date_end: filter.dateRange?.end,
    page: filter.page,
    pageSize: filter.pageSize,
  })
  // 兼容 Supabase (data/pageSize/totalPages) 和 FastAPI (items/page_size/total_pages)
  const newsItems = data.data || data.items || []
  return {
    items: newsItems.map((item, i) => mapNewsItem(item, i)),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize || data.page_size || 20,
    totalPages: data.totalPages || data.total_pages || 1,
  }
}

export async function fetchNewsById(id: string): Promise<NewsItem | undefined> {
  try {
    const item = await apiFetch<ApiNewsItem>(`/api/news/${id}`)
    return mapNewsItem(item, 0)
  } catch {
    return undefined
  }
}

export async function fetchHotNews(count = 6): Promise<NewsItem[]> {
  const items = await apiFetch<ApiNewsItem[]>('/api/news/hot', { limit: count })
  return items.map((item, i) => mapNewsItem(item, i))
}

export async function fetchLatestNews(count = 8): Promise<NewsItem[]> {
  const items = await apiFetch<ApiNewsItem[]>('/api/news/latest', { limit: count })
  return items.map((item, i) => mapNewsItem(item, i))
}

export async function fetchRelatedNews(newsId: string, count = 5): Promise<NewsItem[]> {
  const items = await apiFetch<ApiNewsItem[]>(`/api/news/${newsId}/related`, { limit: count })
  return items.map((item, i) => mapNewsItem(item, i))
}

export async function fetchStats() {
  const data = await apiFetch<ApiStatsResponse>('/api/news/stats')
  return {
    totalSources: data.total_sources,
    totalNews: data.total_news,
    todayNews: data.today_news,
    provinces: data.provinces,
    categories: data.categories,
    fetchTime: '',
    successSources: data.total_sources,
  }
}

export function getCategories(): string[] { return categories }

// ─── 抓取报告 API ───

export interface ScrapeSourceDetail {
  source_id: string
  source_name: string
  items_found: number
  items_new: number
  status: string
  duration: number
  error: string | null
}

export interface ScrapeReport {
  id: number
  report_date: string | null
  started_at: string | null
  ended_at: string | null
  total_sources: number
  success_sources: number
  failed_sources: number
  total_items: number
  new_items: number
  duration_seconds: number
  source_details: ScrapeSourceDetail[]
  status: string
  error_message: string | null
  created_at: string | null
}

export interface ReportListResponse {
  items?: ScrapeReport[]
  data?: ScrapeReport[]
  total: number
  page: number
  page_size?: number
  pageSize?: number
  total_pages?: number
  totalPages?: number
}

export async function fetchReports(page = 1, pageSize = 20): Promise<ReportListResponse> {
  const raw = await apiFetch<ReportListResponse>('/api/reports', { page, pageSize })
  return {
    items: raw.data || raw.items || [],
    total: raw.total,
    page: raw.page,
    page_size: raw.pageSize || raw.page_size || pageSize,
    total_pages: raw.totalPages || raw.total_pages || 1,
  }
}

export async function fetchReportById(id: number): Promise<ScrapeReport> {
  return apiFetch<ScrapeReport>(`/api/reports/${id}`)
}

export async function fetchLatestReport(): Promise<ScrapeReport | null> {
  return apiFetch<ScrapeReport | null>('/api/reports/latest')
}
