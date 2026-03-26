import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsCard } from '@/components/news/NewsCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchNews, getCategories } from '@/data/news-service'
import { getRegions } from '@/data/sources'
import type { NewsFilter } from '@/types/news'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9

export function NewsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter state from URL params
  const regionParam = searchParams.get('region') || ''
  const categoryParam = searchParams.get('category') || ''
  const keywordParam = searchParams.get('keyword') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [keyword, setKeyword] = useState(keywordParam)

  const regions = getRegions()
  const categories = getCategories()

  // Build filter
  const filter: NewsFilter = {
    page: pageParam,
    pageSize: PAGE_SIZE,
    region: regionParam || undefined,
    category: categoryParam || undefined,
    keyword: keywordParam || undefined,
  }

  const result = fetchNews(filter)

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // Reset page on filter change
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const setPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchParams, setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('keyword', keyword)
  }

  const clearAllFilters = () => {
    setSearchParams({})
    setKeyword('')
  }

  const hasActiveFilters = regionParam || categoryParam || keywordParam

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">新闻列表</h1>
            <p className="text-muted-foreground mt-2">
              共 {result.total} 条新闻
              {regionParam && <span> · 地区：{regionParam}</span>}
              {categoryParam && <span> · 分类：{categoryParam}</span>}
              {keywordParam && <span> · 搜索：{keywordParam}</span>}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Sidebar filter — desktop */}
            <aside className={cn(
              "hidden lg:block w-64 flex-shrink-0 space-y-6"
            )}>
              <SidebarContent
                regions={regions}
                categories={categories}
                regionParam={regionParam}
                categoryParam={categoryParam}
                updateParam={updateParam}
              />
            </aside>

            {/* Mobile filter button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
              <Button
                variant="hero"
                size="icon"
                className="w-14 h-14 rounded-full shadow-elevated"
                onClick={() => setSidebarOpen(true)}
                aria-label="打开筛选器"
              >
                <Filter className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile filter drawer */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-foreground">筛选</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <SidebarContent
                    regions={regions}
                    categories={categories}
                    regionParam={regionParam}
                    categoryParam={categoryParam}
                    updateParam={(k, v) => { updateParam(k, v); setSidebarOpen(false); }}
                  />
                </div>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Search bar + active filters */}
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      placeholder="搜索新闻标题、标签..."
                      className="w-full h-10 pl-10 pr-4 rounded-lg border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-fast"
                    />
                  </div>
                  <Button type="submit" variant="default" size="default">搜索</Button>
                </form>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">已选筛选：</span>
                    {regionParam && (
                      <Badge variant="primary" className="cursor-pointer gap-1" onClick={() => updateParam('region', '')}>
                        {regionParam} <X className="w-3 h-3" />
                      </Badge>
                    )}
                    {categoryParam && (
                      <Badge variant="emerald" className="cursor-pointer gap-1" onClick={() => updateParam('category', '')}>
                        {categoryParam} <X className="w-3 h-3" />
                      </Badge>
                    )}
                    {keywordParam && (
                      <Badge variant="outline" className="cursor-pointer gap-1" onClick={() => { updateParam('keyword', ''); setKeyword(''); }}>
                        &ldquo;{keywordParam}&rdquo; <X className="w-3 h-3" />
                      </Badge>
                    )}
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline ml-2">
                      清除全部
                    </button>
                  </div>
                )}
              </div>

              {/* News grid */}
              {result.items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">暂无符合条件的新闻</p>
                  <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                    清除筛选条件
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                  {result.items.map(news => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {result.totalPages > 1 && (
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ─── Sidebar filter component ───
interface SidebarProps {
  regions: string[]
  categories: string[]
  regionParam: string
  categoryParam: string
  updateParam: (key: string, value: string) => void
}

function SidebarContent({ regions, categories, regionParam, categoryParam, updateParam }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">新闻分类</h4>
        <div className="space-y-1">
          <button
            onClick={() => updateParam('category', '')}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-fast",
              !categoryParam ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            全部分类
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateParam('category', cat)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-fast",
                categoryParam === cat ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">地区筛选</h4>
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          <button
            onClick={() => updateParam('region', '')}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-fast",
              !regionParam ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            全部地区
          </button>
          {regions.map(region => (
            <button
              key={region}
              onClick={() => updateParam('region', region)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-fast",
                regionParam === region ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pagination ───
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const getPages = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-8">
      <Button
        variant="outline"
        size="icon"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="上一页"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-10 text-center text-muted-foreground text-sm">...</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(p)}
            className="w-10 h-10"
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="下一页"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}