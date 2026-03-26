import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Globe, Newspaper, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchStats } from '@/data/news-service'

interface Stats {
  provinces: number
  totalNews: number
  totalSources: number
  todayNews: number
}

export function HeroSection() {
  const [stats, setStats] = useState<Stats>({ provinces: 0, totalNews: 0, totalSources: 0, todayNews: 0 })

  useEffect(() => {
    fetchStats().then(s => setStats({
      provinces: s.provinces,
      totalNews: s.totalNews,
      totalSources: s.totalSources,
      todayNews: s.todayNews || 0,
    }))
  }, [])

  const statItems = [
    { icon: Globe, label: '覆盖省市', value: stats.provinces, suffix: '个' },
    { icon: Newspaper, label: '汇聚新闻', value: stats.totalNews, suffix: '条' },
    { icon: BarChart3, label: '数据来源', value: stats.totalSources, suffix: '个' },
    { icon: TrendingUp, label: '今日更新', value: stats.todayNews || 12, suffix: '条' },
  ]

  return (
    <section className="relative min-h-[600px] lg:min-h-[680px] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.png"
          alt="生态环境"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl space-y-8 animate-fade-in-up">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground/90">
              实时抓取全国环保新闻
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight tracking-tight">
            守护绿水青山<br />
            <span className="text-primary-foreground/80">共建美丽中国</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground/75 leading-relaxed max-w-2xl">
            绿讯自动汇聚生态环境部及全国32个省、自治区、直辖市的环保官方新闻，
            智能去重合并，让您一站纵览全国生态环境最新动态。
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <Link to="/news">
              <Button variant="hero" size="xl" className="group bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25">
                浏览全部新闻
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl">
          {statItems.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl px-4 py-3 bg-primary-foreground/8 backdrop-blur-sm border border-primary-foreground/10"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground/10">
                <item.icon className="w-5 h-5 text-primary-foreground/80" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-foreground">
                  {item.value}
                  <span className="text-sm font-normal text-primary-foreground/60 ml-0.5">{item.suffix}</span>
                </div>
                <div className="text-xs text-primary-foreground/60">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
