"""
数据模型 — ScrapeLog（爬取日志）
"""
from sqlalchemy import String, Column, Text, Integer, DateTime, ForeignKey, func

from app.database import Base


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String(10), ForeignKey("sources.id", ondelete="CASCADE"))
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    items_found = Column(Integer, default=0)
    items_new = Column(Integer, default=0)
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
