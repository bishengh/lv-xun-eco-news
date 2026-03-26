// 新闻数据类型定义

export interface NewsSource {
  id: string
  name: string
  shortName: string
  region: string
  url: string
  category: 'national' | 'province' | 'municipality' | 'autonomous'
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  source: NewsSource
  publishDate: string
  category: string
  imageUrl?: string
  originalUrl: string
  tags: string[]
  viewCount: number
  /** 是否为合并后的新闻 (多来源报道同一事件) */
  merged: boolean
  mergedSources?: NewsSource[]
}

export interface NewsFilter {
  region?: string
  source?: string
  dateRange?: { start: string; end: string }
  keyword?: string
  category?: string
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}