-- ============================================
-- 绿讯 PostgreSQL 数据库初始化
-- ============================================

-- 来源分类枚举
CREATE TYPE source_category AS ENUM ('national', 'province', 'municipality', 'autonomous');

-- ─── 数据来源表 ───
CREATE TABLE IF NOT EXISTS sources (
    id          VARCHAR(10)      PRIMARY KEY,
    name        VARCHAR(100)     NOT NULL,
    short_name  VARCHAR(20)      NOT NULL,
    region      VARCHAR(20)      NOT NULL,
    url         VARCHAR(300)     NOT NULL,
    category    source_category  NOT NULL,
    created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- ─── 新闻表 ───
CREATE TABLE IF NOT EXISTS news (
    id          VARCHAR(64)      PRIMARY KEY,
    title       TEXT             NOT NULL,
    url         TEXT             NOT NULL UNIQUE,
    date        DATE,
    summary     TEXT,
    source_id   VARCHAR(10)      NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    category    VARCHAR(50)      DEFAULT '环保资讯',
    tags        TEXT[]           DEFAULT '{}',
    merged      BOOLEAN          DEFAULT FALSE,
    view_count  INTEGER          DEFAULT 0,
    created_at  TIMESTAMPTZ      DEFAULT NOW(),
    updated_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- ─── 爬取日志表 ───
CREATE TABLE IF NOT EXISTS scrape_logs (
    id              SERIAL          PRIMARY KEY,
    source_id       VARCHAR(10)     REFERENCES sources(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    items_found     INTEGER         DEFAULT 0,
    items_new       INTEGER         DEFAULT 0,
    status          VARCHAR(20)     DEFAULT 'pending',
    error_message   TEXT
);

-- ─── 抓取报告表 ───
CREATE TABLE IF NOT EXISTS scrape_reports (
    id              SERIAL          PRIMARY KEY,
    report_date     DATE            NOT NULL,
    started_at      TIMESTAMPTZ     NOT NULL,
    ended_at        TIMESTAMPTZ,
    total_sources   INTEGER         DEFAULT 0,
    success_sources INTEGER         DEFAULT 0,
    failed_sources  INTEGER         DEFAULT 0,
    total_items     INTEGER         DEFAULT 0,
    new_items       INTEGER         DEFAULT 0,
    duration_seconds FLOAT          DEFAULT 0,
    source_details  JSONB           DEFAULT '[]'::jsonb,
    status          VARCHAR(20)     DEFAULT 'running',
    error_message   TEXT,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ─── 索引 ───
CREATE INDEX idx_news_source_id  ON news(source_id);
CREATE INDEX idx_news_date       ON news(date DESC);
CREATE INDEX idx_news_category   ON news(category);
CREATE INDEX idx_news_created_at ON news(created_at DESC);
CREATE INDEX idx_news_title_gin  ON news USING gin(to_tsvector('simple', title));
CREATE INDEX idx_scrape_logs_source ON scrape_logs(source_id);
CREATE INDEX idx_reports_date   ON scrape_reports(report_date DESC);
CREATE INDEX idx_reports_status ON scrape_reports(status);

-- ─── 初始数据：35 个来源 ───
INSERT INTO sources (id, name, short_name, region, url, category) VALUES
    ('mee', '生态环境部', '生态环境部', '全国', 'https://www.mee.gov.cn', 'national'),
    ('bj', '北京市生态环境局', '北京', '北京', 'https://sthjj.beijing.gov.cn', 'municipality'),
    ('sh', '上海市生态环境局', '上海', '上海', 'https://sthj.sh.gov.cn', 'municipality'),
    ('tj', '天津市生态环境局', '天津', '天津', 'https://sthj.tj.gov.cn', 'municipality'),
    ('cq', '重庆市生态环境局', '重庆', '重庆', 'https://sthjj.cq.gov.cn', 'municipality'),
    ('heb', '河北省生态环境厅', '河北', '河北', 'https://hbepb.hebei.gov.cn', 'province'),
    ('sx', '山西省生态环境厅', '山西', '山西', 'https://sthjt.shanxi.gov.cn', 'province'),
    ('ln', '辽宁省生态环境厅', '辽宁', '辽宁', 'https://sthj.ln.gov.cn', 'province'),
    ('jl', '吉林省生态环境厅', '吉林', '吉林', 'https://sthjt.jl.gov.cn', 'province'),
    ('hlj', '黑龙江省生态环境厅', '黑龙江', '黑龙江', 'https://sthj.hlj.gov.cn', 'province'),
    ('js', '江苏省生态环境厅', '江苏', '江苏', 'https://sthjt.jiangsu.gov.cn', 'province'),
    ('zj', '浙江省生态环境厅', '浙江', '浙江', 'https://sthjt.zj.gov.cn', 'province'),
    ('ah', '安徽省生态环境厅', '安徽', '安徽', 'https://sthjt.ah.gov.cn', 'province'),
    ('fj', '福建省生态环境厅', '福建', '福建', 'https://sthjt.fujian.gov.cn', 'province'),
    ('jx', '江西省生态环境厅', '江西', '江西', 'https://sthjt.jiangxi.gov.cn', 'province'),
    ('sd', '山东省生态环境厅', '山东', '山东', 'https://sthj.shandong.gov.cn', 'province'),
    ('hen', '河南省生态环境厅', '河南', '河南', 'https://sthjt.henan.gov.cn', 'province'),
    ('hub', '湖北省生态环境厅', '湖北', '湖北', 'https://sthjt.hubei.gov.cn', 'province'),
    ('hun', '湖南省生态环境厅', '湖南', '湖南', 'https://sthjt.hunan.gov.cn', 'province'),
    ('gd', '广东省生态环境厅', '广东', '广东', 'https://gdee.gd.gov.cn', 'province'),
    ('hi', '海南省生态环境厅', '海南', '海南', 'https://hnsthj.hainan.gov.cn', 'province'),
    ('sc', '四川省生态环境厅', '四川', '四川', 'https://sthjt.sc.gov.cn', 'province'),
    ('gz', '贵州省生态环境厅', '贵州', '贵州', 'https://sthj.guizhou.gov.cn', 'province'),
    ('yn', '云南省生态环境厅', '云南', '云南', 'https://sthjt.yn.gov.cn', 'province'),
    ('sxn', '陕西省生态环境厅', '陕西', '陕西', 'https://sthjt.shaanxi.gov.cn', 'province'),
    ('gs', '甘肃省生态环境厅', '甘肃', '甘肃', 'https://sthj.gansu.gov.cn', 'province'),
    ('qh', '青海省生态环境厅', '青海', '青海', 'https://sthjt.qinghai.gov.cn', 'province'),
    ('tw', '台湾地区环境部', '台湾', '台湾', 'https://www.moenv.gov.tw', 'province'),
    ('nmg', '内蒙古自治区生态环境厅', '内蒙古', '内蒙古', 'https://sthjt.nmg.gov.cn', 'autonomous'),
    ('gx', '广西壮族自治区生态环境厅', '广西', '广西', 'https://sthjt.gxzf.gov.cn', 'autonomous'),
    ('xz', '西藏自治区生态环境厅', '西藏', '西藏', 'https://ee.xizang.gov.cn', 'autonomous'),
    ('nx', '宁夏回族自治区生态环境厅', '宁夏', '宁夏', 'https://sthjt.nx.gov.cn', 'autonomous'),
    ('xj', '新疆维吾尔自治区生态环境厅', '新疆', '新疆', 'https://sthjt.xinjiang.gov.cn', 'autonomous'),
    ('hk', '香港特别行政区环境及生态局', '香港', '香港', 'https://www.eeb.gov.hk', 'municipality'),
    ('mo', '澳门特别行政区环境保护局', '澳门', '澳门', 'https://www.dspa.gov.mo', 'municipality')
ON CONFLICT (id) DO NOTHING;
