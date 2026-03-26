# 绿讯 — 全国环保新闻聚合平台

自动抓取生态环境部及全国 32 个省、自治区、直辖市环保官网新闻，智能去重合并，一站纵览全国生态环境最新动态。

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)

---

## 功能特性

- **全国覆盖** — 聚合生态环境部 + 32 省市自治区环保官网，共 35 个数据来源
- **智能去重** — 跨来源相同新闻自动合并，标注"多源报道"
- **自动分类** — 智能识别新闻类别：政策法规、污染防治、生态保护、环境监测、绿色发展等
- **自动标签** — 基于关键词提取新闻标签，方便检索
- **多维筛选** — 支持按地区、分类、关键词搜索与筛选
- **响应式设计** — 完美适配桌面端、平板、手机
- **现代 UI** — 绿色主题设计系统，毛玻璃效果、流畅动画

---

## 页面说明

| 页面 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | Hero 横幅、实时统计、最新资讯、热门关注、省份浏览 |
| 新闻列表 | `/news` | 全部新闻分页展示，侧栏分类/地区筛选，搜索功能 |
| 新闻详情 | `/news/:id` | 新闻正文、来源信息、多源标记、标签、相关推荐 |
| 关于 | `/about` | 平台介绍、功能特性、数据来源列表 |

---

## 技术架构

### 前端

```
React 18 + TypeScript + Vite 6 + Tailwind CSS 3
```

- **路由**：react-router-dom v7
- **组件库**：shadcn/ui 风格（button、card、badge）
- **图标**：lucide-react
- **样式工具**：class-variance-authority + clsx + tailwind-merge
- **设计系统**：CSS 自定义属性（HSL 颜色 token、渐变、阴影、动画）

### 爬虫

```
Python 3 + requests + BeautifulSoup4 + lxml
```

- 支持 3 种页面解析策略：`dl/dt/dd` 列表、`mobile_list` 列表、`ul/li` 简单列表
- 自动识别页面编码，兼容 GB2312/UTF-8
- 跨来源标题去重合并
- 输出 JSON 至 `public/data/news.json`

---

## 数据来源（35 个）

### 国家级
| 来源 | 网址 |
|------|------|
| 生态环境部 | https://www.mee.gov.cn |

### 直辖市（4 个）
北京、上海、天津、重庆

### 省份（22 个）
河北、山西、辽宁、吉林、黑龙江、江苏、浙江、安徽、福建、江西、山东、河南、湖北、湖南、广东、海南、四川、贵州、云南、陕西、甘肃、青海

### 自治区（5 个）
内蒙古、广西、西藏、宁夏、新疆

### 特别行政区（2 个）
香港、澳门

---

## 项目结构

```
lv-xun-eco-news/
├── public/
│   ├── data/
│   │   └── news.json              # 抓取的新闻数据（380 条）
│   └── images/
│       ├── hero-bg.png             # 首页背景图
│       ├── news-1.png              # 新闻配图
│       ├── news-2.png
│       └── news-3.png
├── src/
│   ├── components/
│   │   ├── home/
│   │   │   ├── HeroSection.tsx     # 首页 Hero 横幅 + 统计数据
│   │   │   ├── NewsSection.tsx     # 最新资讯 + 热门关注
│   │   │   └── RegionBrowser.tsx   # 按省份浏览
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # 响应式导航栏
│   │   │   └── Footer.tsx          # 页脚
│   │   ├── news/
│   │   │   └── NewsCard.tsx        # 新闻卡片（default/featured/compact）
│   │   └── ui/
│   │       ├── badge.tsx           # 徽章组件
│   │       ├── button.tsx          # 按钮组件
│   │       └── card.tsx            # 卡片组件
│   ├── data/
│   │   ├── news-service.ts        # 异步新闻数据服务（加载/筛选/分页）
│   │   └── sources.ts             # 35 个新闻来源配置
│   ├── lib/
│   │   └── utils.ts               # 工具函数（cn）
│   ├── pages/
│   │   ├── HomePage.tsx            # 首页
│   │   ├── NewsListPage.tsx        # 新闻列表页
│   │   ├── NewsDetailPage.tsx      # 新闻详情页
│   │   └── AboutPage.tsx           # 关于页
│   ├── types/
│   │   └── news.ts                # TypeScript 类型定义
│   ├── App.tsx                     # 路由配置
│   ├── index.css                   # 设计系统（CSS 变量/渐变/动画）
│   └── main.tsx                    # 入口文件
├── scraper.py                      # Python 新闻爬虫脚本
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.8
- npm 或 yarn

### 安装依赖

```bash
# 前端依赖
npm install

# 爬虫依赖
pip install requests beautifulsoup4 lxml
```

### 抓取新闻数据

```bash
python scraper.py
```

运行后新闻数据将保存到 `public/data/news.json`。

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看网站。

### 构建生产版本

```bash
npm run build
```

构建产物输出至 `dist/` 目录。

---

## 开发过程

### 第一步：设计与前端搭建

1. 确立绿色主题设计系统（Deep Forest Green + Emerald + Gold Accent）
2. 定义 CSS 自定义属性：颜色 token、渐变、阴影、动画
3. 使用 AI 生成高质量配图（Hero 背景、新闻配图）
4. 搭建组件体系：布局组件、UI 基础组件、新闻卡片组件
5. 实现四个页面：首页、新闻列表、新闻详情、关于
6. 全程 TypeScript 类型安全，零编译错误

### 第二步：新闻爬虫开发

1. 研究全国各省市环保官网页面结构，归纳 3 种主要模式
2. 编写 Python 爬虫，针对不同页面结构使用不同解析策略
3. 实现自动分类（9 大类别）和关键词标签提取
4. 实现跨来源新闻去重合并
5. 首次运行成功抓取 **21 个来源、380 条新闻**

### 第三步：前后端对接

1. 重构 `news-service.ts`：从 mock 数据改为异步加载 `news.json`
2. 所有页面组件适配异步数据：`useState` + `useEffect` 模式
3. 添加 loading 状态展示
4. 浏览器端全页面验证通过

---

## 抓取结果统计

| 指标 | 数值 |
|------|------|
| 配置来源总数 | 35 个 |
| 成功抓取来源 | 21 个 |
| 抓取新闻总数 | 380 条 |
| 去重后新闻数 | 380 条 |
| 新闻分类覆盖 | 9 大类 |

---

## License

MIT
