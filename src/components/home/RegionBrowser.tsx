import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { getSourcesByCategory } from '@/data/sources'
import { cn } from '@/lib/utils'

export function RegionBrowser() {
  const groups = getSourcesByCategory()

  const sections = [
    { label: '国家级', sources: groups.national, color: 'bg-primary text-primary-foreground' },
    { label: '直辖市', sources: groups.municipality, color: 'bg-emerald text-emerald-foreground' },
    { label: '省份', sources: groups.province, color: '' },
    { label: '自治区', sources: groups.autonomous, color: '' },
  ]

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            按省份浏览
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            覆盖生态环境部及全国32个省、自治区、直辖市环保官方新闻
          </p>
        </div>

        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.label}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {section.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.sources.map(source => (
                  <Link
                    key={source.id}
                    to={`/news?region=${encodeURIComponent(source.region)}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-smooth border",
                      section.color
                        ? section.color
                        : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {source.shortName}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}