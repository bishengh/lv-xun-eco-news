"""
数据模型 — News（新闻）
"""
from sqlalchemy import String, Column, Text, Date, Boolean, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class News(Base):
    __tablename__ = "news"

    id = Column(String(64), primary_key=True)
    title = Column(Text, nullable=False)
    url = Column(Text, nullable=False, unique=True)
    date = Column(Date, nullable=True)
    summary = Column(Text, nullable=True)
    source_id = Column(String(10), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), default="环保资讯")
    tags = Column(ARRAY(Text), default=[])
    merged = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关联
    source = relationship("Source", back_populates="news_items", lazy="selectin")
