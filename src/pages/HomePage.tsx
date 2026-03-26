import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { LatestNewsSection, HotNewsSection } from '@/components/home/NewsSection'
import { RegionBrowser } from '@/components/home/RegionBrowser'

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <LatestNewsSection />
        <HotNewsSection />
        <RegionBrowser />
      </main>
      <Footer />
    </div>
  )
}