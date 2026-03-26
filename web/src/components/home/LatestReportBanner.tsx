import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLatestReport, type ScrapeReport } from '@/data/news-service'
import { cn } from '@/lib/utils'
import { FileText, CheckCircle, XCircle, Database, Clock, ArrowRight, TrendingUp } from 'lucide-react'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}秒`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}分${s}秒`
}

export function LatestReportBanner() {
  const [report, setReport] = useState<ScrapeReport | null>(null)

  useEffect(() => {
    fetchLatestReport()
      .then(r => setReport(r))
      .catch(() => {})
  }, [])

  if (!report) return null

  const successRate = report.total_sources > 0
    ? ((report.success_sources / report.total_sources) * 100).toFixed(0)
    : '0'

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <Link to="/reports" className="block group">
          <div className="relative overflow-hidden bg-card border rounded-2xl shadow-card hover:shadow-card-hover transition-smooth p-6">
            {/* 左侧装饰条 */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-gradient rounded-l-2xl" />

            <div className="flex items-center gap-4 flex-wrap pl-3">
              {/* 图标 */}
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              {/* 标题 */}
              <div className="min-w-[120px]">
                <p className="text-sm font-semibold text-foreground">最新抓取报告</p>
                <p className="text-xs text-muted-foreground">{report.report_date}</p>
              </div>

              {/* 指标 */}
              <div className="flex items-center gap-6 ml-auto flex-wrap">
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-muted-foreground">成功率</span>
                  <span className={cn('font-semibold', Number(successRate) >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{successRate}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-muted-foreground">新增</span>
                  <span className="font-semibold text-primary">+{report.new_items}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm hidden sm:flex">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">{report.success_sources}</span>
                  {report.failed_sources > 0 && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-semibold text-red-500">{report.failed_sources}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm hidden md:flex">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatDuration(report.duration_seconds)}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-smooth" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
