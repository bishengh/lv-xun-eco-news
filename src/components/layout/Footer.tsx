import { Link } from 'react-router-dom'
import { Leaf, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-subtle-gradient">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">绿讯</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              汇聚全国生态环境新闻，实时追踪生态环境部及32个省市环保动态，为环保事业提供全面的信息服务。
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">快速导航</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-fast">首页</Link>
              <Link to="/news" className="text-sm text-muted-foreground hover:text-primary transition-fast">新闻列表</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-fast">关于我们</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">联系方式</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>contact@lvxun.eco</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>北京市朝阳区</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 绿讯 — 全国环保新闻聚合平台。数据来源于各省市生态环境厅官方网站。
          </p>
          <p className="text-xs text-muted-foreground">
            本站仅做新闻聚合展示，内容版权归原作者所有
          </p>
        </div>
      </div>
    </footer>
  )
}