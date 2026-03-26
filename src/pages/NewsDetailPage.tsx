import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Eye, ExternalLink, Layers, Share2, Tag } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { NewsCard } from '@/components/news/NewsCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchNewsById, fetchRelatedNews } from '@/data/news-service'

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const news = id ? fetchNewsById(id) : undefined
  const related = id ? fetchRelatedNews(id, 5) : []

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-xl text-muted-foreground">新闻不存在或已被删除</p>
            <Link to="/news">
              <Button variant="outline">
                <ArrowLeft className="mr-2 w-4 h-4" />
                返回新闻列表
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: news.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-fast">首页</Link>
            <span>/</span>
            <Link to="/news" className="hover:text-primary transition-fast">新闻列表</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[300px]">{news.title}</span>
          </div>

          <div className="flex gap-10">
            {/* Main content */}
            <article className="flex-1 min-w-0">
              {/* Header */}
              <header className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="emerald">{news.category}</Badge>
                  {news.merged && (
                    <Badge variant="gold" className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      多源报道
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  {news.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {news.publishDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {news.viewCount.toLocaleString()} 次阅读
                  </span>
                  <Badge variant="source">{news.source.name}</Badge>
                </div>

                {/* Merged sources */}
                {news.merged && news.mergedSources && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-accent/50 border border-border">
                    <span className="text-xs text-muted-foreground font-medium">多来源报道：</span>
                    {news.mergedSources.map(source => (
                      <Badge key={source.id} variant="source" className="text-xs">
                        {source.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </header>

              {/* Hero image */}
              {news.imageUrl && (
                <div className="rounded-xl overflow-hidden mb-8">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </div>
              )}

              {/* Content body */}
              <div
                className="prose prose-lg max-w-none text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: news.content }}
                style={{
                  lineHeight: '1.8',
                }}
              />

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {news.tags.map(tag => (
                  <Link key={tag} to={`/news?keyword=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-fast">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1.5" />
                  分享
                </Button>
                <a href={news.originalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    查看原文
                  </Button>
                </a>
              </div>
            </article>

            {/* Sidebar — related news */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">相关新闻</h3>
                  <div className="space-y-1">
                    {related.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无相关新闻</p>
                    ) : (
                      related.map(item => (
                        <NewsCard key={item.id} news={item} variant="compact" />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile related news */}
          {related.length > 0 && (
            <div className="lg:hidden mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold text-foreground mb-4">相关新闻</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.slice(0, 4).map(item => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}