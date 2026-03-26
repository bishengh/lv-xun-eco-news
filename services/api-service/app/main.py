"""
绿讯 API Service — FastAPI 主入口
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import news, sources


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    print("🌿 绿讯 API Service 启动")
    yield
    print("🌿 绿讯 API Service 关闭")


app = FastAPI(
    title="绿讯 API",
    description="全国环保新闻聚合平台 — RESTful API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(news.router)
app.include_router(sources.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "lvxun-api"}
