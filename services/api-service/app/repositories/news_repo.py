"""
Repository — News 数据访问
"""
from datetime import date
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.news import News
from app.models.source import Source


class NewsRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_filtered(
        self,
        *,
        region: str | None = None,
        source_id: str | None = None,
        category: str | None = None,
        keyword: str | None = None,
        date_start: date | None = None,
        date_end: date | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[News], int]:
        """带筛选 + 分页的查询"""
        base = select(News).options(selectinload(News.source))
        count_base = select(func.count(News.id))

        # 筛选条件
        conditions = []
        if region:
            conditions.append(News.source.has(Source.region == region))
        if source_id:
            conditions.append(News.source_id == source_id)
        if category:
            conditions.append(News.category == category)
        if keyword:
            kw = f"%{keyword}%"
            conditions.append(or_(News.title.ilike(kw), News.summary.ilike(kw)))
        if date_start:
            conditions.append(News.date >= date_start)
        if date_end:
            conditions.append(News.date <= date_end)

        for cond in conditions:
            base = base.where(cond)
            count_base = count_base.where(cond)

        # 总数
        total_result = await self.db.execute(count_base)
        total = total_result.scalar() or 0

        # 分页
        offset = (page - 1) * page_size
        stmt = base.order_by(desc(News.date), desc(News.created_at)).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def get_by_id(self, news_id: str) -> News | None:
        result = await self.db.execute(
            select(News).options(selectinload(News.source)).where(News.id == news_id)
        )
        return result.scalar_one_or_none()

    async def get_latest(self, count: int = 8) -> list[News]:
        result = await self.db.execute(
            select(News)
            .options(selectinload(News.source))
            .order_by(desc(News.date), desc(News.created_at))
            .limit(count)
        )
        return list(result.scalars().all())

    async def get_hot(self, count: int = 6) -> list[News]:
        result = await self.db.execute(
            select(News)
            .options(selectinload(News.source))
            .order_by(desc(News.view_count), desc(News.date))
            .limit(count)
        )
        return list(result.scalars().all())

    async def get_related(self, news_id: str, count: int = 5) -> list[News]:
        target = await self.get_by_id(news_id)
        if not target:
            return []
        result = await self.db.execute(
            select(News)
            .options(selectinload(News.source))
            .where(News.id != news_id, News.category == target.category)
            .order_by(desc(News.date))
            .limit(count)
        )
        return list(result.scalars().all())

    async def get_categories(self) -> list[str]:
        result = await self.db.execute(
            select(News.category).distinct().order_by(News.category)
        )
        return [row[0] for row in result.all() if row[0]]

    async def get_total_count(self) -> int:
        result = await self.db.execute(select(func.count(News.id)))
        return result.scalar() or 0

    async def get_today_count(self) -> int:
        today = date.today()
        result = await self.db.execute(
            select(func.count(News.id)).where(News.date == today)
        )
        return result.scalar() or 0

    async def increment_view_count(self, news_id: str) -> None:
        news = await self.get_by_id(news_id)
        if news:
            news.view_count = (news.view_count or 0) + 1
            await self.db.commit()
