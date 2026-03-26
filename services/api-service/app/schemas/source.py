"""
Pydantic Schemas — Source
"""
from pydantic import BaseModel
from datetime import datetime


class SourceOut(BaseModel):
    id: str
    name: str
    short_name: str
    region: str
    url: str
    category: str

    model_config = {"from_attributes": True}


class SourceStats(BaseModel):
    id: str
    short_name: str
    region: str
    category: str
    news_count: int
