# 绿讯 — 全国环保新闻聚合平台

自动抓取生态环境部及全国 34 个省、自治区、直辖市、特别行政区环保官网新闻，智能去重合并，一站纵览全国生态环境最新动态。

> 📊 **当前数据**：35 个数据源 · 1214+ 条新闻 · 9 大分类 · 每日 08:00 自动更新

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                         │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  lvxun-web   │  │  lvxun-api   │  │  lvxun-scraper    │  │
│  │  React/Nginx │→ │  FastAPI     │  │  APScheduler      │  │
│  │  :3000       │  │  :8000       │  │  每天 08:00 抓取   │  │
│  └─────────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                          │                    │             │
│                    ┌─────▼────────────────────▼──────┐      │
│                    │        lvxun-db                  │      │
│                    │     PostgreSQL 16                │      │
│                    │  sources | news | scrape_reports │      │
│                    │        :5432                     │      │
│                    └─────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**三层架构：**

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| **表现层** | React 18 + TypeScript + Tailwind CSS | SPA 前端，Nginx 生产部署 |
| **业务层** | FastAPI + SQLAlchemy AsyncIO | RESTful API，异步 ORM |
| **数据层** | PostgreSQL 16 | 结构化存储，GIN 全文索引 |

---

## 功能特性

- **全国覆盖** — 聚合生态环境部 + 34 省市自治区及特别行政区环保官网，共 35 个数据来源，100% 抓取成功
- **智能去重** — 跨来源相同新闻自动合并，标注"多源报道"
- **自动分类** — 智能识别新闻类别：政策法规、污染防治、生态保护、环境监测、绿色发展等 9 大类
- **自动标签** — 基于关键词提取新闻标签，方便检索
- **多维筛选** — 支持按地区、来源、分类、关键词、日期范围筛选 + 分页
- **定时抓取** — APScheduler 每天早上 8:00 自动执行全量抓取
- **抓取报告** — 每次抓取自动生成详细报告（成功率、各来源明细、新增条数、耗时统计）
- **响应式设计** — 完美适配桌面端、平板、手机
- **容器化部署** — Docker Compose 一键启动全部服务

---

## 页面说明

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | Hero 横幅、实时统计、最新抓取报告摘要、最新资讯、热门关注、省份浏览 |
| 新闻列表 | `/news` | 全部新闻分页展示，侧栏分类/地区筛选，搜索功能 |
| 新闻详情 | `/news/:id` | 新闻正文、来源信息、多源标记、标签、相关推荐 |
| 抓取报告 | `/reports` | 报告列表、详情查看（成功/失败来源分组、核心指标面板） |
| 关于 | `/about` | 平台介绍、功能特性、数据来源列表 |

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/news` | 新闻列表（支持 region/source/category/keyword/date_start/date_end/page/pageSize 参数） |
| GET | `/api/news/latest` | 最新新闻 |
| GET | `/api/news/hot` | 热门新闻（按浏览量排序） |
| GET | `/api/news/stats` | 数据统计（来源数、新闻数、分类列表） |
| GET | `/api/news/{id}` | 新闻详情（自动增加浏览量） |
| GET | `/api/news/{id}/related` | 相关推荐 |
| GET | `/api/sources` | 数据来源列表 |
| GET | `/api/sources/stats` | 来源统计（含各来源新闻数） |
| GET | `/api/reports` | 抓取报告列表（分页） |
| GET | `/api/reports/latest` | 最新抓取报告 |
| GET | `/api/reports/{id}` | 报告详情（含各来源抓取明细） |

---

## 数据库设计

```sql
-- 数据来源（35 条）
sources (id, name, short_name, region, url, category)

-- 新闻（1214+ 条）
news (id, title, url, date, summary, source_id, category, tags[], merged, view_count)

-- 抓取日志（每来源每次）
scrape_logs (id, source_id, started_at, ended_at, items_found, items_new, status)

-- 抓取报告（每次完整抓取）
scrape_reports (id, report_date, started_at, ended_at, total_sources, success_sources,
                failed_sources, total_items, new_items, duration_seconds, source_details JSONB, status)
```

---

## 数据来源（35 个）

### 国家级（1 个）

| 来源 | 网址 |
|------|------|
| 生态环境部 | https://www.mee.gov.cn |

### 直辖市（4 个）

| 来源 | 网址 |
|------|------|
| 北京市生态环境局 | https://sthjj.beijing.gov.cn |
| 上海市生态环境局 | https://sthj.sh.gov.cn |
| 天津市生态环境局 | https://sthj.tj.gov.cn |
| 重庆市生态环境局 | https://sthjj.cq.gov.cn |

### 省份（23 个）

| 来源 | 网址 |
|------|------|
| 河北省生态环境厅 | https://hbepb.hebei.gov.cn |
| 山西省生态环境厅 | https://sthjt.shanxi.gov.cn |
| 辽宁省生态环境厅 | https://sthj.ln.gov.cn |
| 吉林省生态环境厅 | https://sthjt.jl.gov.cn |
| 黑龙江省生态环境厅 | https://sthj.hlj.gov.cn |
| 江苏省生态环境厅 | https://sthjt.jiangsu.gov.cn |
| 浙江省生态环境厅 | https://sthjt.zj.gov.cn |
| 安徽省生态环境厅 | https://sthjt.ah.gov.cn |
| 福建省生态环境厅 | https://sthjt.fujian.gov.cn |
| 江西省生态环境厅 | https://sthjt.jiangxi.gov.cn |
| 山东省生态环境厅 | https://sthj.shandong.gov.cn |
| 河南省生态环境厅 | https://sthjt.henan.gov.cn |
| 湖北省生态环境厅 | https://sthjt.hubei.gov.cn |
| 湖南省生态环境厅 | https://sthjt.hunan.gov.cn |
| 广东省生态环境厅 | https://gdee.gd.gov.cn |
| 海南省生态环境厅 | https://hnsthj.hainan.gov.cn |
| 四川省生态环境厅 | https://sthjt.sc.gov.cn |
| 贵州省生态环境厅 | https://sthj.guizhou.gov.cn |
| 云南省生态环境厅 | https://sthjt.yn.gov.cn |
| 陕西省生态环境厅 | https://sthjt.shaanxi.gov.cn |
| 甘肃省生态环境厅 | https://sthj.gansu.gov.cn |
| 青海省生态环境厅 | https://sthjt.qinghai.gov.cn |
| 台湾地区环境部 | https://www.moenv.gov.tw |

### 自治区（5 个）

| 来源 | 网址 |
|------|------|
| 内蒙古自治区生态环境厅 | https://sthjt.nmg.gov.cn |
| 广西壮族自治区生态环境厅 | https://sthjt.gxzf.gov.cn |
| 西藏自治区生态环境厅 | https://ee.xizang.gov.cn |
| 宁夏回族自治区生态环境厅 | https://sthjt.nx.gov.cn |
| 新疆维吾尔自治区生态环境厅 | https://sthjt.xinjiang.gov.cn |

### 特别行政区（2 个）

| 来源 | 网址 |
|------|------|
| 香港特别行政区环境及生态局 | https://www.eeb.gov.hk |
| 澳门特别行政区环境保护局 | https://www.dspa.gov.mo |

---

## 项目结构

```
lv-xun-eco-news/
├── docker-compose.yml                  # Docker Compose 编排（4 服务）
│
├── services/
│   ├── api-service/                    # 业务层 — FastAPI 微服务
│   │   ├── app/
│   │   │   ├── config.py              # 配置（数据库连接、CORS）
│   │   │   ├── database.py            # 异步数据库引擎 + 会话
│   │   │   ├── main.py                # FastAPI 入口（CORS、路由注册）
│   │   │   ├── models/                # SQLAlchemy ORM 模型
│   │   │   │   ├── news.py            # 新闻模型
│   │   │   │   ├── source.py          # 数据来源模型
│   │   │   │   ├── scrape_log.py      # 抓取日志模型
│   │   │   │   └── scrape_report.py   # 抓取报告模型
│   │   │   ├── schemas/               # Pydantic 数据验证
│   │   │   │   ├── news.py            # 新闻请求/响应 Schema
│   │   │   │   ├── source.py          # 来源 Schema
│   │   │   │   └── report.py          # 报告 Schema
│   │   │   ├── repositories/          # 数据访问层（Repository 模式）
│   │   │   │   ├── news_repo.py       # 新闻查询（筛选/分页/统计）
│   │   │   │   ├── source_repo.py     # 来源查询
│   │   │   │   └── report_repo.py     # 报告查询
│   │   │   ├── services/              # 业务逻辑层
│   │   │   │   └── news_service.py    # 新闻业务逻辑
│   │   │   └── routers/               # API 路由
│   │   │       ├── news.py            # /api/news/*
│   │   │       ├── sources.py         # /api/sources/*
│   │   │       └── reports.py         # /api/reports/*
│   │   ├── init.sql                   # 数据库初始化（建表 + 35 来源）
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── scraper-service/               # 爬虫微服务
│       ├── scraper.py                 # 35 源爬虫（7 种解析策略）
│       ├── scheduler.py               # APScheduler 定时调度（每天 08:00）
│       ├── db_writer.py               # 数据库写入（UPSERT + 报告生成）
│       ├── scraper_fallback.json      # WAF/JS 站点 fallback 数据
│       ├── requirements.txt
│       └── Dockerfile
│
├── web/                               # 表现层 — React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx    # 首页 Hero 横幅 + 统计
│   │   │   │   ├── NewsSection.tsx    # 最新资讯 + 热门关注
│   │   │   │   ├── RegionBrowser.tsx  # 按省份浏览
│   │   │   │   └── LatestReportBanner.tsx  # 最新抓取报告摘要
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # 响应式导航栏
│   │   │   │   └── Footer.tsx         # 页脚
│   │   │   ├── news/
│   │   │   │   └── NewsCard.tsx       # 新闻卡片
│   │   │   └── ui/                    # 基础 UI 组件
│   │   ├── data/
│   │   │   └── news-service.ts        # API 调用服务（新闻 + 报告）
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # 首页
│   │   │   ├── NewsListPage.tsx       # 新闻列表页
│   │   │   ├── NewsDetailPage.tsx     # 新闻详情页
│   │   │   ├── ReportsPage.tsx        # 抓取报告页
│   │   │   └── AboutPage.tsx          # 关于页
│   │   ├── types/news.ts             # TypeScript 类型定义
│   │   ├── index.css                  # 设计系统（CSS 变量/渐变/动画）
│   │   ├── App.tsx                    # 路由配置
│   │   └── main.tsx                   # 入口
│   ├── nginx.conf                     # Nginx 生产配置（SPA + API 反向代理）
│   ├── vite.config.ts                 # Vite 配置（开发代理）
│   ├── package.json
│   └── Dockerfile                     # 多阶段构建（node -> nginx）
│
├── docs/                              # 项目文档
│   ├── 需求规格说明书.md               # SRS（GB/T 9385-2008 标准）
│   └── 项目设计报告.md                 # 系统设计文档（SDD）
│
└── README.md
```

---

## 快速开始

### 环境要求

- Docker Desktop >= 4.0
- Docker Compose >= 2.0
- Node.js >= 18（仅开发模式需要）

### 方式一：Docker Compose 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/bishengh/lv-xun-eco-news.git
cd lv-xun-eco-news

# 启动全部服务
docker compose up -d

# 查看服务状态
docker ps
```

启动后：
- 前端：http://localhost:3000
- API：http://localhost:8000
- API 文档：http://localhost:8000/docs
- PostgreSQL：localhost:5432

### 方式二：开发模式

```bash
# 1. 启动数据库和 API
docker compose up -d postgres api-service

# 2. 启动前端开发服务器（热更新）
cd web
npm install
npm run dev
```

前端开发服务器：http://localhost:5173（自动代理 API 到 8000 端口）

### 手动触发抓取

```bash
# 立即执行一次抓取
docker compose run --rm scraper-service python scraper.py
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://lvxun:lvxun_2026@postgres:5432/lvxun` | 数据库连接 |
| `MAX_NEWS` | `200` | 每来源最大抓取条数 |
| `MAX_PAGES` | `6` | 每来源最大分页数 |
| `DATE_DAYS` | `60` | 只保留近 N 天的新闻 |
| `CRON_HOUR` | `8` | 定时抓取小时 |
| `CRON_MINUTE` | `0` | 定时抓取分钟 |
| `RUN_ON_START` | `false` | 启动时是否立即执行一次抓取 |
| `TZ` | `Asia/Shanghai` | 时区 |

---

## 技术细节

### 爬虫

- 7 种页面解析策略：`dl/dt/dd`、`mobile_list`、`ul/li`、`table`、专用解析器（上海/江苏/江西/西藏/香港/澳门/台湾）
- WAF 防护应对：Session cookie、Referer 伪造、fallback 预存数据
- 数据库写入采用 `INSERT ... ON CONFLICT DO UPDATE`（UPSERT），保证幂等
- 每次抓取自动生成报告（含每个来源的抓取条数、新增数、耗时、状态）

### API

- 异步架构：FastAPI + SQLAlchemy AsyncIO + asyncpg
- Repository 模式分离数据访问逻辑
- 支持多维组合筛选（地区 + 来源 + 分类 + 关键词 + 日期范围）
- GIN 索引支持新闻标题全文搜索

### 前端

- 设计系统：CSS 自定义属性（HSL 颜色 token、渐变、阴影、动画过渡）
- 组件库：shadcn/ui 风格（button、card、badge）
- 路由：react-router-dom v7
- API 调用层统一封装，类型安全

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.3 | 2026-03-26 | 每日定时抓取 + 抓取报告系统 + 历史数据导入 + 项目文档（SRS/SDD） |
| v0.2 | 2026-03-26 | 微服务架构重构 — PostgreSQL + FastAPI + Docker Compose |
| v0.1 | 2026-03-25 | 初始版本 — React 前端 + Python 爬虫，35 源全量抓取 |

---

## License

MIT
