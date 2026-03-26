import { Link, useLocation } from 'react-router-dom'
import { Leaf, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navLinks = [
  { label: '首页', href: '/' },
  { label: '新闻列表', href: '/news' },
  { label: '抓取报告', href: '/reports' },
  { label: '关于', href: '/about' },
]

export function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isHome = location.pathname === '/'

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-smooth",
        isHome
          ? "bg-primary/80 backdrop-blur-md border-b border-primary-foreground/10"
          : "glass border-b"
      )}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-smooth",
            isHome ? "bg-primary-foreground/15" : "bg-primary/10"
          )}>
            <Leaf className={cn(
              "w-5 h-5 transition-smooth group-hover:rotate-12",
              isHome ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
          <span className={cn(
            "text-xl font-bold tracking-tight",
            isHome ? "text-primary-foreground" : "text-foreground"
          )}>
            绿讯
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = link.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.href)
            return (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "font-medium",
                    isHome
                      ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      : "",
                    isActive && isHome && "text-primary-foreground bg-primary-foreground/15",
                    isActive && !isHome && "text-primary bg-accent"
                  )}
                >
                  {link.label}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "md:hidden",
            isHome ? "text-primary-foreground hover:bg-primary-foreground/10" : ""
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="切换导航菜单"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={cn(
          "md:hidden border-t px-4 pb-4 pt-2",
          isHome ? "bg-primary/95 border-primary-foreground/10" : "glass border-border"
        )}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block py-3 px-3 rounded-md text-sm font-medium transition-fast",
                isHome
                  ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  : "text-foreground hover:bg-accent"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}