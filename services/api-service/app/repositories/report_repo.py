"""Repository: 抓取报告数据访问"""
import math
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scrape_report import ScrapeReport


async def get_reports(db: AsyncSession, page: int = 1, page_size: int = 20):
    """分页获取报告列表"""
    # 总数
    count_q = select(func.count(ScrapeReport.id))
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    # 分页查询
    offset = (page - 1) * page_size
    q = (
        select(ScrapeReport)
        .order_by(desc(ScrapeReport.id))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(q)
    items = result.scalars().all()

    return items, total, page, page_size, total_pages


async def get_report_by_id(db: AsyncSession, report_id: int):
    """根据 ID 获取报告详情"""
    q = select(ScrapeReport).where(ScrapeReport.id == report_id)
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def get_latest_report(db: AsyncSession):
    """获取最新一份已完成的报告"""
    q = (
        select(ScrapeReport)
        .where(ScrapeReport.status == "completed")
        .order_by(desc(ScrapeReport.id))
        .limit(1)
    )
    result = await db.execute(q)
    return result.scalar_one_or_none()
