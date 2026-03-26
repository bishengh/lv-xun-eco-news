import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useEffect, useState } from 'react'
import { fetchReports, fetchReportById, type ScrapeReport, type ReportListResponse } from '@/data/news-service'
import { cn } from '@/lib/utils'
import {
  FileText, CheckCircle, XCircle, Clock, Database,
  ChevronLeft, ChevronRight, ArrowLeft, Loader2,
  TrendingUp, AlertTriangle, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function formatDateTime(dt: string | null): string {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
    completed: { label: '已完成', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    running: { label: '运行中', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Loader2 },
    failed: { label: '失败', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  }
  const cfg = map[status] || map.failed
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.className)}>
      <Icon className={cn('w-3.5 h-3.5', status === 'running' && 'animate-spin')} />
      {cfg.label}
    </span>
  )
}

function SourceStatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-block w-2 h-2 rounded-full',
      status === 'success' ? 'bg-emerald-500' : status === 'db_error' ? 'bg-amber-500' : 'bg-red-400'
    )} />
  )
}

/* ──── 报告详情视图 ──── */
function ReportDetail({ report, onBack }: { report: ScrapeReport; onBack: () => void }) {
  const successRate = report.total_sources > 0 ? ((report.success_sources / report.total_sources) * 100).toFixed(0) : '0'
  const details = (report.source_details || []).sort((a, b) => b.items_new - a.items_new)
  const successDetails = details.filter(d => d.status === 'success')
  const failedDetails = details.filter(d => d.status !== 'success')

  return (
    <div className="space-y-8">
      {/* 顶部信息 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Button>
        <div className="flex-1" />
        <StatusBadge status={report.status} />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">
          抓取报告 #{report.id}
        </h2>
        <p className="text-muted-foreground mt-1">
          {report.report_date || '-'} · 开始 {formatDateTime(report.started_at)} · 结束 {formatDateTime(report.ended_at)}
        </p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '成功率', value: `${successRate}%`, sub: `${report.success_sources}/${report.total_sources}`, icon: TrendingUp, color: 'text-emerald-600' },
          { label: '抓取条数', value: String(report.total_items), icon: Database, color: 'text-blue-600' },
          { label: '新增入库', value: String(report.new_items), icon: BarChart3, color: 'text-primary' },
          { label: '失败来源', value: String(report.failed_sources), icon: AlertTriangle, color: report.failed_sources > 0 ? 'text-red-500' : 'text-muted-foreground' },
          { label: '耗时', value: formatDuration(report.duration_seconds), icon: Clock, color: 'text-muted-foreground' },
        ].map(m => (
          <div key={m.label} className="bg-card border rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={cn('w-4 h-4', m.color)} />
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
            </div>
            <p className={cn('text-xl font-bold', m.color)}>{m.value}</p>
            {m.sub && <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* 成功来源 */}
      {successDetails.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            成功来源 ({successDetails.length})
          </h3>
          <div className="bg-card border rounded-xl overflow-hidden shadow-card">
            <div className="grid grid-cols-[1fr_80px_80px_80px] md:grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <span>来源</span>
              <span className="text-right">抓取</span>
              <span className="text-right">新增</span>
              <span className="text-right">耗时</span>
            </div>
            <div className="divide-y divide-border">
              {successDetails.map(d => (
                <div key={d.source_id} className="grid grid-cols-[1fr_80px_80px_80px] md:grid-cols-[1fr_100px_100px_100px] gap-2 px-4 py-2.5 text-sm items-center hover:bg-muted/30 transition-fast">
                  <span className="flex items-center gap-2">
                    <SourceStatusDot status={d.status} />
                    <span className="font-medium">{d.source_name}</span>
                  </span>
                  <span className="text-right text-muted-foreground">{d.items_found}</span>
                  <span className={cn('text-right font-medium', d.items_new > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>{d.items_new > 0 ? `+${d.items_new}` : '0'}</span>
                  <span className="text-right text-muted-foreground">{d.duration.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 失败来源 */}
      {failedDetails.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            失败来源 ({failedDetails.length})
          </h3>
          <div className="bg-card border rounded-xl overflow-hidden shadow-card">
            <div className="divide-y divide-border">
              {failedDetails.map(d => (
                <div key={d.source_id} className="px-4 py-3 hover:bg-muted/30 transition-fast">
                  <div className="flex items-center gap-2 text-sm">
                    <SourceStatusDot status={d.status} />
                    <span className="font-medium">{d.source_name}</span>
                    <span className="text-xs text-red-400 ml-auto">{d.error || '抓取失败'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──── 主页面 ──── */
export function ReportsPage() {
  const [data, setData] = useState<ReportListResponse | null>(null)
  const [selectedReport, setSelectedReport] = useState<ScrapeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetchReports(page, 15)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const handleViewDetail = async (id: number) => {
    try {
      const report = await fetchReportById(id)
      setSelectedReport(report)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          {/* 标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">抓取报告</h1>
                <p className="text-sm text-muted-foreground">每日 08:00 自动抓取全国 35 个环保数据源</p>
              </div>
            </div>
          </div>

          {/* 详情视图 or 列表视图 */}
          {selectedReport ? (
            <ReportDetail report={selectedReport} onBack={() => setSelectedReport(null)} />
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : !data || !data.items || data.items.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">暂无抓取报告</p>
              <p className="text-sm text-muted-foreground/70 mt-1">系统每天早上 8:00 自动执行抓取任务</p>
            </div>
          ) : (
            <>
              {/* 报告卡片列表 */}
              <div className="space-y-3">
                {data.items.map(report => {
                  const successRate = report.total_sources > 0 ? ((report.success_sources / report.total_sources) * 100).toFixed(0) : '0'
                  return (
                    <button
                      key={report.id}
                      onClick={() => handleViewDetail(report.id)}
                      className="w-full text-left bg-card border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-smooth group"
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* 日期 */}
                        <div className="w-20">
                          <p className="text-sm font-bold text-foreground">{report.report_date || '-'}</p>
                        </div>

                        {/* 状态 */}
                        <StatusBadge status={report.status} />

                        {/* 指标 */}
                        <div className="flex items-center gap-6 ml-auto text-sm">
                          <div className="text-center hidden sm:block">
                            <p className="text-muted-foreground text-xs">成功率</p>
                            <p className={cn('font-semibold', Number(successRate) >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{successRate}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">抓取</p>
                            <p className="font-semibold text-foreground">{report.total_items}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">新增</p>
                            <p className={cn('font-semibold', report.new_items > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>+{report.new_items}</p>
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className="text-muted-foreground text-xs">耗时</p>
                            <p className="font-semibold text-muted-foreground">{formatDuration(report.duration_seconds)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-fast" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 分页 */}
              {(data.total_pages || 0) > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline" size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    {page} / {data.total_pages || 1}
                  </span>
                  <Button
                    variant="outline" size="sm"
                    disabled={page >= (data.total_pages || 1)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
