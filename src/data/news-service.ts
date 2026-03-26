import type { NewsItem, NewsFilter, PaginatedResult, NewsSource } from '@/types/news'
import { newsSources } from './sources'

// 新闻分类列表
const categories = ['政策法规', '污染防治', '生态保护', '环境监测', '绿色发展', '督察执法', '国际合作', '科技创新', '环保资讯']

// 配图池 — 按分类分配
const categoryImages: Record<string, string> = {
  '污染防治': '/images/news-1.png',
  '生态保护': '/images/news-1.png',
  '绿色发展': '/images/news-2.png',
  '科技创新': '/images/news-2.png',
  '环境监测': '/images/news-3.png',
  '国际合作': '/images/news-3.png',
}
const defaultImages = ['/images/news-1.png', '/images/news-2.png', '/images/news-3.png']

// ─── JSON 原始数据类型 ───

interface RawNewsItem {
  title: string
  url: string
  date: string
  summary: string
  source: { id: string; name: string; shortName: string; region: string; category: string }
  id: string
  merged: boolean
  mergedSources?: NewsSource[]
  tags: string[]
  category: string
}

interface RawData {
  fetchTime: string
  totalSources: number
  successSources: number
  totalNews: number
  news: RawNewsItem[]
}

// ─── 数据加载 & 缓存 ───

let _cached: NewsItem[] | null = null
let _raw: RawData | null = null
let _promise: Promise<void> | null = null

function img(item: RawNewsItem, i: number) {
  return categoryImages[item.category] || defaultImages[i % 3]
}

async function load(): Promise<void> {
  if (_cached) return
  if (_promise) return _promise
  _promise = (async () => {
    try {
      const r = await fetch('/data/news.json')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      _raw = await r.json() as RawData
      _cached = _raw.news.map((n, i) => ({
        id: n.id,
        title: n.title,
        summary: n.summary || n.title,
        content: n.summary
          ? `<p>${n.summary}</p><p>更多详情请查看原文链接。</p>`
          : `<p>${n.title}</p><p>更多详情请查看原文链接。</p>`,
        source: { ...n.source, url: '', category: n.source.category as NewsSource['category'] },
        publishDate: n.date || '2026-03-26',
        category: n.category || '环保资讯',
        imageUrl: img(n, i),
        originalUrl: n.url,
        tags: n.tags?.length ? n.tags : ['环保资讯'],
        viewCount: Math.floor(Math.random() * 3000) + 100,
        merged: n.merged || false,
        mergedSources: n.mergedSources,
      }))
      _cached.sort((a, b) => b.publishDate.localeCompare(a.publishDate))
    } catch (e) {
      console.error('加载新闻数据失败:', e)
      _cached = []
    }
  })()
  return _promise
}

function all(): NewsItem[] { return _cached || [] }

// ─── 公开 API（异步） ───

export async function fetchNews(filter: NewsFilter): Promise<PaginatedResult<NewsItem>> {
  await load()
  let items = all()

  if (filter.region)
    items = items.filter(n => n.source.region === filter.region || n.mergedSources?.some(s => s.region === filter.region))
  if (filter.source)
    items = items.filter(n => n.source.id === filter.source || n.mergedSources?.some(s => s.id === filter.source))
  if (filter.category)
    items = items.filter(n => n.category === filter.category)
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    items = items.filter(n => n.title.toLowerCase().includes(kw) || n.summary.toLowerCase().includes(kw) || n.tags.some(t => t.toLowerCase().includes(kw)))
  }
  if (filter.dateRange)
    items = items.filter(n => n.publishDate >= filter.dateRange!.start && n.publishDate <= filter.dateRange!.end)

  const total = items.length
  const totalPages = Math.ceil(total / filter.pageSize)
  const start = (filter.page - 1) * filter.pageSize
  return { items: items.slice(start, start + filter.pageSize), total, page: filter.page, pageSize: filter.pageSize, totalPages }
}

export async function fetchNewsById(id: string): Promise<NewsItem | undefined> {
  await load()
  return all().find(n => n.id === id)
}

export async function fetchHotNews(count = 6): Promise<NewsItem[]> {
  await load()
  return [...all()].sort((a, b) => b.viewCount - a.viewCount).slice(0, count)
}

export async function fetchLatestNews(count = 8): Promise<NewsItem[]> {
  await load()
  return all().slice(0, count)
}

export async function fetchRelatedNews(newsId: string, count = 5): Promise<NewsItem[]> {
  await load()
  const target = all().find(n => n.id === newsId)
  if (!target) return []
  return all().filter(n => n.id !== newsId && (n.category === target.category || n.tags.some(t => target.tags.includes(t)))).slice(0, count)
}

export async function fetchStats() {
  await load()
  const a = all()
  const today = new Date().toISOString().split('T')[0]
  return {
    totalSources: newsSources.length,
    totalNews: a.length,
    todayNews: a.filter(n => n.publishDate === today).length || a.filter(n => n.publishDate >= '2026-03-25').length,
    provinces: new Set(newsSources.map(s => s.region)).size,
    categories: [...new Set(a.map(n => n.category))],
    fetchTime: _raw?.fetchTime || '',
    successSources: _raw?.successSources || 0,
  }
}

export function getCategories(): string[] { return categories }