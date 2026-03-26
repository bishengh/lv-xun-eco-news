import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Eye, Layers } from 'lucide-react'
import type { NewsItem } from '@/types/news'
import { cn } from '@/lib/utils'

interface NewsCardProps {
  news: NewsItem
  variant?: 'default' | 'compact' | 'featured'
}

export function NewsCard({ news, variant = 'default' }: NewsCardProps) {
  if (variant === 'featured') {
    return <FeaturedCard news={news} />
  }
  if (variant === 'compact') {
    return <CompactCard news={news} />
  }
  return <DefaultCard news={news} />
}

function DefaultCard({ news }: { news: NewsItem }) {
  return (
    <Link to={`/news/${news.id}`} className="block group">
      <Card className="overflow-hidden hover:-translate-y-1 transition-smooth">
        {news.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover transition-smooth group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge variant="emerald">{news.category}</Badge>
              {news.merged && (
                <Badge variant="gold" className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  多源
                </Badge>
              )}
            </div>
          </div>
        )}
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-fast">
            {news.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {news.summary}
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {news.publishDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {news.viewCount.toLocaleString()}
              </span>
            </div>
            <Badge variant="source">{news.source.shortName}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function FeaturedCard({ news }: { news: NewsItem }) {
  return (
    <Link to={`/news/${news.id}`} className="block group">
      <Card className="overflow-hidden hover:-translate-y-1 transition-smooth">
        <div className="grid md:grid-cols-2">
          {news.imageUrl && (
            <div className="relative h-64 md:h-full overflow-hidden">
              <img
                src={news.imageUrl}
                alt={news.title}
                className="w-full h-full object-cover transition-smooth group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4 flex gap-1.5">
                <Badge variant="emerald">{news.category}</Badge>
                {news.merged && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    多源
                  </Badge>
                )}
              </div>
            </div>
          )}
          <CardContent className="p-6 md:p-8 flex flex-col justify-center space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-fast">
              {news.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed line-clamp-3">
              {news.summary}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {news.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {news.publishDate}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {news.viewCount.toLocaleString()}
                </span>
              </div>
              <Badge variant="source">{news.source.shortName}</Badge>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}

function CompactCard({ news }: { news: NewsItem }) {
  return (
    <Link to={`/news/${news.id}`} className="block group">
      <div className={cn(
        "flex items-start gap-4 p-4 rounded-lg border border-transparent",
        "hover:border-border hover:bg-card transition-smooth"
      )}>
        {news.imageUrl && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover transition-smooth group-hover:scale-110"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-fast leading-snug">
            {news.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="source" className="text-[10px] px-1.5 py-0">{news.source.shortName}</Badge>
            <span>{news.publishDate}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}