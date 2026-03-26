"""Router: 抓取报告 API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories import report_repo
from app.schemas.report import ReportOut, ReportListResponse, ReportSummary

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """获取抓取报告列表（分页）"""
    items, total, p, ps, tp = await report_repo.get_reports(db, page, page_size)
    return ReportListResponse(
        items=[ReportOut.model_validate(r) for r in items],
        total=total,
        page=p,
        page_size=ps,
        total_pages=tp,
    )


@router.get("/latest", response_model=ReportOut | None)
async def get_latest_report(db: AsyncSession = Depends(get_db)):
    """获取最新一份已完成的抓取报告"""
    report = await report_repo.get_latest_report(db)
    if not report:
        return None
    return ReportOut.model_validate(report)


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """根据 ID 获取抓取报告详情"""
    report = await report_repo.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return ReportOut.model_validate(report)
