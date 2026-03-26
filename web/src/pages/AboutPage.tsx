import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, RefreshCw, Layers, Shield, ArrowRight } from 'lucide-react'
import { newsSources } from '@/data/sources'

const features = [
  {
    icon: Globe,
    title: '全国覆盖',
    description: '自动抓取生态环境部及全国32个省、自治区、直辖市环保官网的新闻栏目，确保信息全面覆盖。'
  },
  {
    icon: RefreshCw,
    title: '实时更新',
    description: '定时抓取各来源最新新闻，确保您第一时间获取全国生态环境领域的最新动态。'
  },
  {
    icon: Layers,
    title: '智能去重',
    description: '通过标题相似度和内容指纹技术，自动识别和合并不同来源的相同新闻，避免重复阅读。'
  },
  {
    icon: Shield,
    title: '官方可信',
    description: '所有新闻均来自各级政府生态环境部门官方网站，确保信息的权威性和可靠性。'
  }
]

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <Badge variant="emerald" className="mb-2">关于绿讯</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              让环保信息触手可及
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              绿讯是一个环保新闻聚合平台，致力于汇聚全国生态环境领域的官方新闻，
              通过智能去重合并技术，为公众、研究人员和环保从业者提供全面、及时、便捷的环保信息服务。
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
            {features.map(f => (
              <div
                key={f.title}
                className="p-6 rounded-xl border bg-card transition-smooth hover:shadow-card-hover"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Sources count */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              数据来源
            </h2>
            <p className="text-muted-foreground">
              共覆盖 {newsSources.length} 个官方来源
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-12">
            {newsSources.map(source => (
              <Badge key={source.id} variant="outline" className="text-xs">
                {source.name}
              </Badge>
            ))}
          </div>

          <div className="text-center">
            <Link to="/news">
              <Button variant="hero" size="xl" className="group">
                开始浏览新闻
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}