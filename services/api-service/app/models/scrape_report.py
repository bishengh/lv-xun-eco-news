"""ORM Model: 抓取报告"""
from sqlalchemy import Column, Integer, String, Float, Date, Text, JSON
from sqlalchemy.dialects.postgresql import TIMESTAMP
from app.database import Base


class ScrapeReport(Base):
    __tablename__ = "scrape_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_date = Column(Date, nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), nullable=False)
    ended_at = Column(TIMESTAMP(timezone=True), nullable=True)
    total_sources = Column(Integer, default=0)
    success_sources = Column(Integer, default=0)
    failed_sources = Column(Integer, default=0)
    total_items = Column(Integer, default=0)
    new_items = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0)
    source_details = Column(JSON, default=[])
    status = Column(String(20), default="running")
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=True)
