"""
Router — 新闻来源 API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories.source_repo import SourceRepository
from app.schemas.source import SourceOut, SourceStats

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[SourceOut])
async def list_sources(db: AsyncSession = Depends(get_db)):
    """获取全部新闻来源"""
    repo = SourceRepository(db)
    sources = await repo.get_all()
    return [SourceOut.model_validate(s) for s in sources]


@router.get("/stats", response_model=list[SourceStats])
async def source_stats(db: AsyncSession = Depends(get_db)):
    """获取来源新闻数量统计"""
    repo = SourceRepository(db)
    return await repo.get_stats()


@router.get("/{source_id}", response_model=SourceOut)
async def get_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """获取单个来源详情"""
    repo = SourceRepository(db)
    source = await repo.get_by_id(source_id)
    if not source:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="来源不存在")
    return SourceOut.model_validate(source)
