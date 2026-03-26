import type { NewsItem, NewsFilter, PaginatedResult, NewsSource } from '@/types/news'

// ─── API 基础配置 ───
const API_BASE = import.meta.env.VITE_API_URL || ''

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
  source: ApiSource
  category: string
  tags: string[]
  merged: boolean
  view_count: number
  created_at: string | null
}

interface ApiListResponse {
  items: ApiNewsItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
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
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || item.title,
    content: item.summary
      ? `<p>${item.summary}</p><p>更多详情请查看原文链接。</p>`
      : `<p>${item.title}</p><p>更多详情请查看原文链接。</p>`,
    source: mapSource(item.source),
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

async function apiFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const base = API_BASE || window.location.origin
  const url = new URL(path, base)
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
  return {
    items: data.items.map((item, i) => mapNewsItem(item, i)),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
    totalPages: data.total_pages,
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
  const items = await apiFetch<ApiNewsItem[]>('/api/news/hot', { count })
  return items.map((item, i) => mapNewsItem(item, i))
}

export async function fetchLatestNews(count = 8): Promise<NewsItem[]> {
  const items = await apiFetch<ApiNewsItem[]>('/api/news/latest', { count })
  return items.map((item, i) => mapNewsItem(item, i))
}

export async function fetchRelatedNews(newsId: string, count = 5): Promise<NewsItem[]> {
  const items = await apiFetch<ApiNewsItem[]>(`/api/news/${newsId}/related`, { count })
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
