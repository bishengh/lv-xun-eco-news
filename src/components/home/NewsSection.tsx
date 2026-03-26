import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewsCard } from '@/components/news/NewsCard'
import { fetchLatestNews, fetchHotNews } from '@/data/news-service'

export function LatestNewsSection() {
  const latest = fetchLatestNews(7)
  const featured = latest[0]
  const rest = latest.slice(1, 7)

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              最新资讯
            </h2>
            <p className="text-muted-foreground mt-2">
              全国生态环境领域最新动态
            </p>
          </div>
          <Link to="/news">
            <Button variant="ghost" size="sm" className="group text-primary hover:text-primary">
              查看全部
              <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Featured + grid */}
        <div className="space-y-6">
          {featured && (
            <NewsCard news={featured} variant="featured" />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {rest.map(news => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function HotNewsSection() {
  const hotNews = fetchHotNews(4)

  return (
    <section className="py-16 lg:py-24 bg-subtle-gradient">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              热门关注
            </h2>
            <p className="text-muted-foreground mt-2">
              阅读量最高的环保新闻
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {hotNews.map(news => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </div>
    </section>
  )
}