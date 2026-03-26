"""
Pydantic Schemas — News
"""
from pydantic import BaseModel, field_serializer
from datetime import date as DateType, datetime
from typing import Optional, Any
from app.schemas.source import SourceOut


class NewsOut(BaseModel):
    id: str
    title: str
    url: str
    date: DateType | None = None
    summary: str | None = None
    source: SourceOut
    category: str = "环保资讯"
    tags: list[str] = []
    merged: bool = False
    view_count: int = 0
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

    @field_serializer("date")
    def serialize_date(self, v: Any) -> str | None:
        if v is None:
            return None
        if isinstance(v, DateType):
            return v.isoformat()
        return str(v)


class NewsListResponse(BaseModel):
    items: list[NewsOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class NewsFilter(BaseModel):
    region: Optional[str] = None
    source_id: Optional[str] = None
    category: Optional[str] = None
    keyword: Optional[str] = None
    date_start: DateType | None = None
    date_end: DateType | None = None
    page: int = 1
    page_size: int = 20


class StatsOut(BaseModel):
    total_sources: int
    total_news: int
    today_news: int
    provinces: int
    categories: list[str]
    sources: list[SourceOut]
