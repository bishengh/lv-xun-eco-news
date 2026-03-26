#!/usr/bin/env python3
"""
绿讯 - 全国环保新闻抓取脚本
从生态环境部及32个省市环保官网抓取新闻，存储为本地JSON
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import hashlib
import time
from datetime import datetime
from urllib.parse import urljoin
import traceback
import sys

# ─── 请求配置 ───
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}
TIMEOUT = 15
MAX_NEWS = 30

# ─── 输出路径 ───
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'data')


def fetch_page(url, encoding=None):
    """获取页面内容"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, verify=False)
        if encoding:
            resp.encoding = encoding
        elif resp.apparent_encoding:
            resp.encoding = resp.apparent_encoding
        return resp.text
    except Exception as e:
        print(f"  [ERROR] 获取页面失败 {url}: {e}")
        return None


def clean_text(text):
    """清理文本"""
    if not text:
        return ''
    return re.sub(r'\s+', ' ', text).strip()


def parse_date(text):
    """从文本中提取日期，统一为 YYYY-MM-DD"""
    if not text:
        return ''
    # 匹配 YYYY-MM-DD
    m = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # 匹配 YYYY年MM月DD日
    m = re.search(r'(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # 匹配 YYYY/MM/DD
    m = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # 从 URL 中提取日期 /YYYYMM/tYYYYMMDD_
    m = re.search(r'/t(\d{4})(\d{2})(\d{2})_', text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return ''


def make_id(title, source_id):
    """生成新闻唯一ID"""
    raw = f"{source_id}:{title}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()[:12]


# ─────────────────────────────────────────────
# 各网站抓取策略
# ─────────────────────────────────────────────

def scrape_mee(source):
    """生态环境部 - 新闻列表"""
    urls = [
        'https://www.mee.gov.cn/ywdt/szyw/',      # 时政要闻
        'https://www.mee.gov.cn/ywdt/hjywnews/',   # 环境要闻
        'https://www.mee.gov.cn/ywdt/dfnews/',     # 地方快讯
    ]
    items = []
    for list_url in urls:
        html = fetch_page(list_url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('li'):
            a = li.select_one('a[href*=".shtml"]')
            if not a:
                continue
            title = clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = urljoin(list_url, a.get('href', ''))
            # 日期
            date_str = ''
            strong = li.select_one('strong')
            span = li.select_one('div > span')
            if strong and span:
                day = clean_text(strong.get_text())
                ym = clean_text(span.get_text())
                date_str = parse_date(f"{ym}-{day}")
            if not date_str:
                date_span = li.select_one('span.date')
                if date_span:
                    date_str = parse_date(date_span.get_text())
            if not date_str:
                date_str = parse_date(href)
            # 摘要
            summary = ''
            dd = li.select_one('dd')
            if dd:
                summary = clean_text(dd.get_text())[:200]

            items.append({
                'title': title,
                'url': href,
                'date': date_str,
                'summary': summary,
            })
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_mobile_list(source, news_urls, encoding=None):
    """通用模板：mobile_list 风格（上海/四川/多省通用模板）"""
    items = []
    for list_url in news_urls:
        html = fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        # 尝试 mobile_list 容器
        containers = soup.select('div.mobile_list ul li, div.bd ul li, ul.news_list li, ul.list li')
        if not containers:
            containers = soup.select('ul li')
        for li in containers:
            a = li.select_one('a')
            if not a:
                continue
            title = clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            # 日期
            date_str = ''
            date_el = li.select_one('span.date, span.time, span.docDate, em')
            if date_el:
                date_str = parse_date(date_el.get_text())
            if not date_str:
                for span in li.select('span'):
                    d = parse_date(span.get_text())
                    if d:
                        date_str = d
                        break
            if not date_str:
                date_str = parse_date(href)
            if not date_str:
                date_str = parse_date(li.get_text())

            items.append({
                'title': title,
                'url': href,
                'date': date_str,
                'summary': '',
            })
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_dl_list(source, news_urls, encoding=None):
    """复杂模板：dl/dt/dd 风格（广东等）"""
    items = []
    for list_url in news_urls:
        html = fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('li'):
            a = li.select_one('dt a, a.cjcx_biaobnan, a[href*=".shtml"]')
            if not a:
                a = li.select_one('a')
            if not a:
                continue
            title = clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            # 日期
            date_str = ''
            date_el = li.select_one('span.cjcx_shijian, span.date')
            if date_el:
                date_str = parse_date(date_el.get_text())
            if not date_str:
                strong = li.select_one('strong')
                span = li.select_one('div > span')
                if strong and span:
                    day = clean_text(strong.get_text())
                    ym = clean_text(span.get_text())
                    date_str = parse_date(f"{ym}-{day}")
            if not date_str:
                date_str = parse_date(href)
            # 摘要
            summary = ''
            dd = li.select_one('dd')
            if dd:
                summary = clean_text(dd.get_text())[:200]

            items.append({
                'title': title,
                'url': href,
                'date': date_str,
                'summary': summary,
            })
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_simple_list(source, news_urls, encoding=None):
    """简单模板：ul > li > a + span（北京等）"""
    items = []
    for list_url in news_urls:
        html = fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('ul li, div.list li, div.newsList li, div.right_list li'):
            a = li.select_one('a')
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            # 日期
            date_str = ''
            for span in li.select('span, em, td:last-child, i'):
                d = parse_date(span.get_text())
                if d:
                    date_str = d
                    break
            if not date_str:
                date_str = parse_date(href)
            if not date_str:
                date_str = parse_date(li.get_text())

            items.append({
                'title': title,
                'url': href,
                'date': date_str,
                'summary': '',
            })
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_generic(source, news_urls, encoding=None):
    """通用抓取策略：自动尝试多种模式"""
    # 先试 mobile_list
    items = scrape_mobile_list(source, news_urls, encoding)
    if len(items) >= 5:
        return items
    # 再试 dl 模式
    items = scrape_dl_list(source, news_urls, encoding)
    if len(items) >= 5:
        return items
    # 最后试简单列表
    items = scrape_simple_list(source, news_urls, encoding)
    return items


# ─────────────────────────────────────────────
# 所有来源配置
# ─────────────────────────────────────────────

SOURCES = [
    # ─── 国家级 ───
    {
        'id': 'mee', 'name': '生态环境部', 'shortName': '生态环境部',
        'region': '全国', 'category': 'national',
        'scraper': 'mee',
        'urls': [],
    },

    # ─── 直辖市 ───
    {
        'id': 'bj', 'name': '北京市生态环境局', 'shortName': '北京',
        'region': '北京', 'category': 'municipality',
        'scraper': 'simple',
        'urls': [
            'https://sthjj.beijing.gov.cn/bjhrb/index/xxgk69/zfxxgk43/fdzdgknr2/ywdt28/xwfb/index.html',
        ],
    },
    {
        'id': 'sh', 'name': '上海市生态环境局', 'shortName': '上海',
        'region': '上海', 'category': 'municipality',
        'scraper': 'generic',
        'urls': [
            'https://www.sthj.sh.gov.cn/hbzhywpt6021/index.html',
        ],
    },
    {
        'id': 'tj', 'name': '天津市生态环境局', 'shortName': '天津',
        'region': '天津', 'category': 'municipality',
        'scraper': 'generic',
        'urls': [
            'https://sthj.tj.gov.cn/ZWXX808/HBYW1316/',
        ],
    },
    {
        'id': 'cq', 'name': '重庆市生态环境局', 'shortName': '重庆',
        'region': '重庆', 'category': 'municipality',
        'scraper': 'generic',
        'urls': [
            'https://sthjj.cq.gov.cn/zwxx_249/zwdt/',
        ],
    },

    # ─── 省份 ───
    {
        'id': 'heb', 'name': '河北省生态环境厅', 'shortName': '河北',
        'region': '河北', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://hbepb.hebei.gov.cn/hbhjt/xwzx/jihuanyaowen/'],
    },
    {
        'id': 'sx', 'name': '山西省生态环境厅', 'shortName': '山西',
        'region': '山西', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.shanxi.gov.cn/xwzx_1/sxhj/'],
    },
    {
        'id': 'ln', 'name': '辽宁省生态环境厅', 'shortName': '辽宁',
        'region': '辽宁', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthj.ln.gov.cn/sthj/zwdt/snyw/index.shtml'],
    },
    {
        'id': 'jl', 'name': '吉林省生态环境厅', 'shortName': '吉林',
        'region': '吉林', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.jl.gov.cn/ywdt/szyw/'],
    },
    {
        'id': 'hlj', 'name': '黑龙江省生态环境厅', 'shortName': '黑龙江',
        'region': '黑龙江', 'category': 'province',
        'scraper': 'generic',
        'urls': ['http://sthj.hlj.gov.cn/sthj/c111945/xwdt.shtml'],
    },
    {
        'id': 'js', 'name': '江苏省生态环境厅', 'shortName': '江苏',
        'region': '江苏', 'category': 'province',
        'scraper': 'generic',
        'urls': [
            'https://sthjt.jiangsu.gov.cn/col/col84025/index.html',
        ],
    },
    {
        'id': 'zj', 'name': '浙江省生态环境厅', 'shortName': '浙江',
        'region': '浙江', 'category': 'province',
        'scraper': 'generic',
        'urls': [
            'https://sthjt.zj.gov.cn/col/col1229429478/index.html',
        ],
    },
    {
        'id': 'ah', 'name': '安徽省生态环境厅', 'shortName': '安徽',
        'region': '安徽', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.ah.gov.cn/hbzx/gzdt/stdt/index.html'],
    },
    {
        'id': 'fj', 'name': '福建省生态环境厅', 'shortName': '福建',
        'region': '福建', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.fujian.gov.cn/zwgk/sthjyw/'],
    },
    {
        'id': 'jx', 'name': '江西省生态环境厅', 'shortName': '江西',
        'region': '江西', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.jiangxi.gov.cn/jxssthjt/col/col42067/index.html'],
    },
    {
        'id': 'sd', 'name': '山东省生态环境厅', 'shortName': '山东',
        'region': '山东', 'category': 'province',
        'scraper': 'generic',
        'urls': [
            'http://www.sdein.gov.cn/dtxx/hbyw/',
        ],
    },
    {
        'id': 'hen', 'name': '河南省生态环境厅', 'shortName': '河南',
        'region': '河南', 'category': 'province',
        'scraper': 'generic',
        'urls': ['http://sthjt.henan.gov.cn/xxzy/dtxw/'],
    },
    {
        'id': 'hub', 'name': '湖北省生态环境厅', 'shortName': '湖北',
        'region': '湖北', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.hubei.gov.cn/hjxw/szyw/'],
    },
    {
        'id': 'hun', 'name': '湖南省生态环境厅', 'shortName': '湖南',
        'region': '湖南', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.hunan.gov.cn/sthjt/xxgk/xwdt/zxdt/list_tyxx.html'],
    },
    {
        'id': 'gd', 'name': '广东省生态环境厅', 'shortName': '广东',
        'region': '广东', 'category': 'province',
        'scraper': 'generic',
        'urls': [
            'https://gdee.gd.gov.cn/hbxw/index.html',
        ],
    },
    {
        'id': 'hi', 'name': '海南省生态环境厅', 'shortName': '海南',
        'region': '海南', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://hnsthb.hainan.gov.cn/ywdt/'],
    },
    {
        'id': 'sc', 'name': '四川省生态环境厅', 'shortName': '四川',
        'region': '四川', 'category': 'province',
        'scraper': 'generic',
        'urls': [
            'https://sthjt.sc.gov.cn/sthjt/c103878/xwdt_list.shtml',
        ],
    },
    {
        'id': 'gz', 'name': '贵州省生态环境厅', 'shortName': '贵州',
        'region': '贵州', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthj.guizhou.gov.cn/xwzx/stdt/'],
    },
    {
        'id': 'yn', 'name': '云南省生态环境厅', 'shortName': '云南',
        'region': '云南', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.yn.gov.cn/'],
    },
    {
        'id': 'sxn', 'name': '陕西省生态环境厅', 'shortName': '陕西',
        'region': '陕西', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.shaanxi.gov.cn/sy/hjyw/'],
    },
    {
        'id': 'gs', 'name': '甘肃省生态环境厅', 'shortName': '甘肃',
        'region': '甘肃', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthj.gansu.gov.cn/sthj/c152440/sthjyw.shtml'],
    },
    {
        'id': 'qh', 'name': '青海省生态环境厅', 'shortName': '青海',
        'region': '青海', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.qinghai.gov.cn/hjgl/hydt/'],
    },

    # ─── 自治区 ───
    {
        'id': 'nmg', 'name': '内蒙古自治区生态环境厅', 'shortName': '内蒙古',
        'region': '内蒙古', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['https://sthjt.nmg.gov.cn/hbdt/'],
    },
    {
        'id': 'gx', 'name': '广西壮族自治区生态环境厅', 'shortName': '广西',
        'region': '广西', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['http://sthjt.gxzf.gov.cn/ttxw/'],
    },
    {
        'id': 'xz', 'name': '西藏自治区生态环境厅', 'shortName': '西藏',
        'region': '西藏', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['https://sthjt.xizang.gov.cn/xwzx/'],
    },
    {
        'id': 'nx', 'name': '宁夏回族自治区生态环境厅', 'shortName': '宁夏',
        'region': '宁夏', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['https://sthjt.nx.gov.cn/xwzx/qnxw/'],
    },
    {
        'id': 'xj', 'name': '新疆维吾尔自治区生态环境厅', 'shortName': '新疆',
        'region': '新疆', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['https://sthjt.xinjiang.gov.cn/xjepd/xwzxtndt/common_list.shtml'],
    },
]


def scrape_source(source):
    """根据来源配置选择抓取策略"""
    sid = source['id']
    scraper_type = source.get('scraper', 'generic')
    urls = source.get('urls', [])
    encoding = source.get('encoding')

    print(f"\n{'='*50}")
    print(f"[{sid}] 正在抓取: {source['name']}")
    print(f"  URL: {urls[0] if urls else 'built-in'}")

    try:
        if scraper_type == 'mee':
            items = scrape_mee(source)
        elif scraper_type == 'simple':
            items = scrape_simple_list(source, urls, encoding)
        elif scraper_type == 'dl':
            items = scrape_dl_list(source, urls, encoding)
        elif scraper_type == 'mobile':
            items = scrape_mobile_list(source, urls, encoding)
        else:
            items = scrape_generic(source, urls, encoding)

        # 过滤无效项 & 去重
        seen = set()
        valid = []
        for item in items:
            if not item['title'] or item['title'] in seen:
                continue
            # 过滤导航/栏目项
            if len(item['title']) < 6:
                continue
            if any(kw in item['title'] for kw in ['首页', '返回', '更多', '下一页', '上一页', '>>',  '...', '当前位置']):
                continue
            seen.add(item['title'])
            valid.append(item)

        items = valid[:MAX_NEWS]
        print(f"  ✅ 成功获取 {len(items)} 条新闻")
        return items

    except Exception as e:
        print(f"  ❌ 抓取失败: {e}")
        traceback.print_exc()
        return []


def deduplicate_news(all_news):
    """跨来源去重合并"""
    title_map = {}
    for item in all_news:
        title = item['title']
        if title in title_map:
            existing = title_map[title]
            if item['source']['id'] not in [s['id'] for s in existing.get('mergedSources', [existing['source']])]:
                if 'mergedSources' not in existing:
                    existing['mergedSources'] = [existing['source']]
                existing['mergedSources'].append(item['source'])
                existing['merged'] = True
            # 保留更早的日期
            if item['date'] and (not existing['date'] or item['date'] < existing['date']):
                existing['date'] = item['date']
        else:
            title_map[title] = item
    return list(title_map.values())


def main():
    print("=" * 60)
    print("  绿讯 - 全国环保新闻抓取程序")
    print(f"  目标: {len(SOURCES)} 个来源, 每源最多 {MAX_NEWS} 条")
    print(f"  时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 禁用 SSL 警告
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    all_news = []
    stats = {'success': 0, 'failed': 0, 'total_items': 0}

    for source_cfg in SOURCES:
        items = scrape_source(source_cfg)
        source_info = {
            'id': source_cfg['id'],
            'name': source_cfg['name'],
            'shortName': source_cfg['shortName'],
            'region': source_cfg['region'],
            'category': source_cfg['category'],
        }

        if items:
            stats['success'] += 1
            stats['total_items'] += len(items)
            for item in items:
                item['source'] = source_info
                item['id'] = make_id(item['title'], source_cfg['id'])
                item['merged'] = False
                item['tags'] = extract_tags(item['title'] + ' ' + item.get('summary', ''))
                item['category'] = classify_news(item['title'] + ' ' + item.get('summary', ''))
        else:
            stats['failed'] += 1

        all_news.extend(items)
        time.sleep(0.5)  # 礼貌延迟

    # 去重合并
    print(f"\n{'='*50}")
    print(f"去重前: {len(all_news)} 条")
    all_news = deduplicate_news(all_news)
    print(f"去重后: {len(all_news)} 条")

    # 按日期排序
    all_news.sort(key=lambda x: x.get('date', ''), reverse=True)

    # 保存到本地
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, 'news.json')
    output_data = {
        'fetchTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'totalSources': len(SOURCES),
        'successSources': stats['success'],
        'failedSources': stats['failed'],
        'totalNews': len(all_news),
        'news': all_news,
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"  抓取完成!")
    print(f"  成功来源: {stats['success']}/{len(SOURCES)}")
    print(f"  失败来源: {stats['failed']}/{len(SOURCES)}")
    print(f"  总新闻数: {len(all_news)} 条 (去重后)")
    print(f"  保存路径: {output_path}")
    print(f"{'='*60}")


def extract_tags(text):
    """从文本中提取标签"""
    tag_keywords = {
        '碳中和': ['碳中和', '零碳'],
        '碳达峰': ['碳达峰', '双碳'],
        '大气污染': ['大气', '空气质量', 'PM2.5', '蓝天', '雾霾', '臭氧'],
        '水污染治理': ['水质', '水环境', '污水', '水污染', '水生态', '河流', '湖泊'],
        '生态保护': ['生态保护', '生态修复', '自然保护', '生物多样性', '野生动物'],
        '固废处理': ['固废', '固体废物', '垃圾', '危废', '土壤污染'],
        '环境监测': ['监测', '监控', '预警', '数据'],
        '绿色发展': ['绿色发展', '绿色低碳', '新能源', '清洁能源', '光伏', '风电'],
        '督察': ['督察', '检查', '执法', '整改'],
        '政策法规': ['法规', '条例', '政策', '意见', '通知', '规划', '方案'],
        '长江保护': ['长江', '长江经济带'],
        '黄河流域': ['黄河'],
        '海洋保护': ['海洋', '近岸海域', '海洋生态'],
        '国际合作': ['国际', '合作', '全球', 'COP'],
    }
    tags = []
    for tag, keywords in tag_keywords.items():
        if any(kw in text for kw in keywords):
            tags.append(tag)
    return tags[:4] if tags else ['环保资讯']


def classify_news(text):
    """智能分类"""
    rules = [
        ('政策法规', ['法规', '条例', '政策', '意见', '通知', '办法', '规定', '标准', '审批', '许可']),
        ('污染防治', ['污染', '大气', '水质', 'PM2.5', '排放', '治理', '防治', '减排', '蓝天', '碧水', '净土']),
        ('生态保护', ['生态', '保护', '修复', '生物多样', '野生', '自然保护', '湿地', '森林']),
        ('环境监测', ['监测', '监控', '预警', '数据', '质量报告', '通报']),
        ('绿色发展', ['绿色', '低碳', '新能源', '清洁', '光伏', '风电', '碳中和', '碳达峰', '循环']),
        ('督察执法', ['督察', '执法', '检查', '整改', '问责', '约谈']),
        ('国际合作', ['国际', '全球', '合作', 'COP', '联合国', '气候']),
        ('科技创新', ['技术', '科技', '创新', '研发', '智能', 'AI', '数字']),
    ]
    for category, keywords in rules:
        if any(kw in text for kw in keywords):
            return category
    return '环保资讯'


if __name__ == '__main__':
    main()
