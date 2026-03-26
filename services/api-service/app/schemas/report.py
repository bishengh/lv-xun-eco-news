"""Pydantic Schemas: 抓取报告"""
from datetime import date as DateType, datetime
from typing import Optional, Any
from pydantic import BaseModel, field_serializer


class SourceDetail(BaseModel):
    source_id: str
    source_name: str
    items_found: int = 0
    items_new: int = 0
    status: str = "failed"
    duration: float = 0
    error: str | None = None


class ReportOut(BaseModel):
    id: int
    report_date: DateType | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    total_sources: int = 0
    success_sources: int = 0
    failed_sources: int = 0
    total_items: int = 0
    new_items: int = 0
    duration_seconds: float = 0
    source_details: list[Any] = []
    status: str = "running"
    error_message: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

    @field_serializer("report_date")
    def serialize_date(self, v: Any) -> str | None:
        if v is None:
            return None
        if isinstance(v, DateType):
            return v.isoformat()
        return str(v)


class ReportListResponse(BaseModel):
    items: list[ReportOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReportSummary(BaseModel):
    """首页简要摘要"""
    id: int
    report_date: DateType | None = None
    success_sources: int = 0
    failed_sources: int = 0
    total_items: int = 0
    new_items: int = 0
    duration_seconds: float = 0
    status: str = "running"

    model_config = {"from_attributes": True}

    @field_serializer("report_date")
    def serialize_date(self, v: Any) -> str | None:
        if v is None:
            return None
        if isinstance(v, DateType):
            return v.isoformat()
        return str(v)
