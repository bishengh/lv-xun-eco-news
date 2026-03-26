"""
数据模型 — Source（来源）
"""
from sqlalchemy import String, Column, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    short_name = Column(String(20), nullable=False)
    region = Column(String(20), nullable=False)
    url = Column(String(300), nullable=False)
    category = Column(String(20), nullable=False)  # national / province / municipality / autonomous
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关联
    news_items = relationship("News", back_populates="source", lazy="selectin")
