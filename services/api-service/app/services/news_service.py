"""
Service — News 业务逻辑
"""
import math
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.news_repo import NewsRepository
from app.repositories.source_repo import SourceRepository
from app.schemas.news import NewsOut, NewsListResponse, NewsFilter, StatsOut
from app.schemas.source import SourceOut


class NewsService:

    def __init__(self, db: AsyncSession):
        self.news_repo = NewsRepository(db)
        self.source_repo = SourceRepository(db)

    async def get_news_list(self, f: NewsFilter) -> NewsListResponse:
        items, total = await self.news_repo.get_filtered(
            region=f.region,
            source_id=f.source_id,
            category=f.category,
            keyword=f.keyword,
            date_start=f.date_start,
            date_end=f.date_end,
            page=f.page,
            page_size=f.page_size,
        )
        total_pages = math.ceil(total / f.page_size) if f.page_size > 0 else 0
        return NewsListResponse(
            items=[NewsOut.model_validate(item) for item in items],
            total=total,
            page=f.page,
            page_size=f.page_size,
            total_pages=total_pages,
        )

    async def get_news_by_id(self, news_id: str) -> NewsOut | None:
        item = await self.news_repo.get_by_id(news_id)
        if not item:
            return None
        # 自增阅读量
        await self.news_repo.increment_view_count(news_id)
        return NewsOut.model_validate(item)

    async def get_latest_news(self, count: int = 8) -> list[NewsOut]:
        items = await self.news_repo.get_latest(count)
        return [NewsOut.model_validate(i) for i in items]

    async def get_hot_news(self, count: int = 6) -> list[NewsOut]:
        items = await self.news_repo.get_hot(count)
        return [NewsOut.model_validate(i) for i in items]

    async def get_related_news(self, news_id: str, count: int = 5) -> list[NewsOut]:
        items = await self.news_repo.get_related(news_id, count)
        return [NewsOut.model_validate(i) for i in items]

    async def get_stats(self) -> StatsOut:
        sources = await self.source_repo.get_all()
        total_news = await self.news_repo.get_total_count()
        today_news = await self.news_repo.get_today_count()
        categories = await self.news_repo.get_categories()
        regions = set(s.region for s in sources)
        return StatsOut(
            total_sources=len(sources),
            total_news=total_news,
            today_news=today_news,
            provinces=len(regions),
            categories=categories,
            sources=[SourceOut.model_validate(s) for s in sources],
        )
