"""
Router — 新闻 API
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.news_service import NewsService
from app.schemas.news import NewsOut, NewsListResponse, NewsFilter, StatsOut

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("", response_model=NewsListResponse)
async def list_news(
    region: Optional[str] = Query(None, description="地区筛选"),
    source_id: Optional[str] = Query(None, alias="source", description="来源ID"),
    category: Optional[str] = Query(None, description="分类"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    date_start: Optional[date] = Query(None, description="开始日期"),
    date_end: Optional[date] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="每页条数"),
    db: AsyncSession = Depends(get_db),
):
    """获取新闻列表（支持筛选和分页）"""
    svc = NewsService(db)
    f = NewsFilter(
        region=region,
        source_id=source_id,
        category=category,
        keyword=keyword,
        date_start=date_start,
        date_end=date_end,
        page=page,
        page_size=page_size,
    )
    return await svc.get_news_list(f)


@router.get("/latest", response_model=list[NewsOut])
async def latest_news(
    count: int = Query(8, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """获取最新新闻"""
    svc = NewsService(db)
    return await svc.get_latest_news(count)


@router.get("/hot", response_model=list[NewsOut])
async def hot_news(
    count: int = Query(6, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """获取热门新闻"""
    svc = NewsService(db)
    return await svc.get_hot_news(count)


@router.get("/stats", response_model=StatsOut)
async def news_stats(db: AsyncSession = Depends(get_db)):
    """获取新闻统计信息"""
    svc = NewsService(db)
    return await svc.get_stats()


@router.get("/{news_id}", response_model=NewsOut)
async def get_news(news_id: str, db: AsyncSession = Depends(get_db)):
    """获取单条新闻详情（会自增阅读量）"""
    svc = NewsService(db)
    item = await svc.get_news_by_id(news_id)
    if not item:
        raise HTTPException(status_code=404, detail="新闻不存在")
    return item


@router.get("/{news_id}/related", response_model=list[NewsOut])
async def related_news(
    news_id: str,
    count: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """获取相关新闻"""
    svc = NewsService(db)
    return await svc.get_related_news(news_id, count)
