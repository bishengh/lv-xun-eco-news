"""
Repository — Source 数据访问
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.source import Source
from app.models.news import News


class SourceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Source]:
        result = await self.db.execute(select(Source).order_by(Source.id))
        return list(result.scalars().all())

    async def get_by_id(self, source_id: str) -> Source | None:
        result = await self.db.execute(select(Source).where(Source.id == source_id))
        return result.scalar_one_or_none()

    async def get_by_category(self, category: str) -> list[Source]:
        result = await self.db.execute(
            select(Source).where(Source.category == category).order_by(Source.id)
        )
        return list(result.scalars().all())

    async def get_stats(self) -> list[dict]:
        """获取每个来源的新闻数量统计"""
        stmt = (
            select(
                Source.id,
                Source.short_name,
                Source.region,
                Source.category,
                func.count(News.id).label("news_count"),
            )
            .outerjoin(News, Source.id == News.source_id)
            .group_by(Source.id)
            .order_by(func.count(News.id).desc())
        )
        result = await self.db.execute(stmt)
        return [
            {
                "id": row.id,
                "short_name": row.short_name,
                "region": row.region,
                "category": row.category,
                "news_count": row.news_count,
            }
            for row in result.all()
        ]
