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

# ─── Fallback 数据（WAF / JS渲染等无法直接抓取的来源） ───
FALLBACK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scraper_fallback.json')
FALLBACK_DATA = {}

def load_fallback_data():
    """加载预抓取的 fallback 数据"""
    global FALLBACK_DATA
    if os.path.exists(FALLBACK_PATH):
        try:
            with open(FALLBACK_PATH, 'r', encoding='utf-8') as f:
                FALLBACK_DATA = json.load(f)
            print(f"[INFO] 已加载 fallback 数据: {list(FALLBACK_DATA.keys())}")
        except Exception as e:
            print(f"[WARN] 加载 fallback 数据失败: {e}")

# ─── 请求配置 ───
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}
TIMEOUT = 20
MAX_NEWS = 200  # 单来源最大条数（支持多页）
MAX_PAGES = 6   # 最多翻页数

# ─── 日期过滤：近2月 ───
from datetime import timedelta
DATE_CUTOFF = (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d')

# ─── 输出路径 ───
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'data')


def fetch_page(url, encoding=None, session=None, extra_headers=None):
    """获取页面内容，支持重试"""
    headers = {**HEADERS}
    if extra_headers:
        headers.update(extra_headers)
    getter = session or requests
    for attempt in range(3):
        try:
            resp = getter.get(url, headers=headers, timeout=TIMEOUT, verify=False, allow_redirects=True)
            if resp.status_code == 412:
                # WAF 拦截 — 换 session 重试
                if session is None:
                    session = requests.Session()
                    session.headers.update(headers)
                    resp = session.get(url, timeout=TIMEOUT, verify=False, allow_redirects=True)
            if resp.status_code != 200:
                print(f"  [WARN] HTTP {resp.status_code} for {url}")
                if attempt < 2:
                    time.sleep(2)
                    continue
                return None
            if encoding:
                resp.encoding = encoding
            elif resp.apparent_encoding:
                resp.encoding = resp.apparent_encoding
            return resp.text
        except Exception as e:
            print(f"  [ERROR] 获取页面失败 {url}: {e}")
            if attempt < 2:
                time.sleep(2)
    return None


def fetch_page_with_session(url, encoding=None):
    """用 Session 获取页面（应对 WAF 412 拦截）"""
    session = requests.Session()
    session.headers.update(HEADERS)
    session.headers['Referer'] = url
    session.headers['Connection'] = 'keep-alive'
    session.headers['Cache-Control'] = 'max-age=0'
    try:
        # 先访问首页建立 cookie
        base = re.match(r'https?://[^/]+', url).group(0) + '/'
        session.get(base, timeout=TIMEOUT, verify=False, allow_redirects=True)
        time.sleep(0.3)
        resp = session.get(url, timeout=TIMEOUT, verify=False, allow_redirects=True)
        if encoding:
            resp.encoding = encoding
        elif resp.apparent_encoding:
            resp.encoding = resp.apparent_encoding
        if resp.status_code == 200:
            return resp.text
        print(f"  [WARN] Session HTTP {resp.status_code} for {url}")
        return None
    except Exception as e:
        print(f"  [ERROR] Session 获取失败 {url}: {e}")
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
    m = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.search(r'(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.search(r'/t(\d{4})(\d{2})(\d{2})_', text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    # URL 路径 /YYYYMMDD/
    m = re.search(r'/(\d{4})(\d{2})(\d{2})/', text)
    if m:
        y, mo, d = m.group(1), m.group(2), m.group(3)
        if 2020 <= int(y) <= 2030:
            return f"{y}-{mo}-{d}"
    # /art/YYYY/M/DD/
    m = re.search(r'/art/(\d{4})/(\d{1,2})/(\d{1,2})/', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return ''


def make_id(title, source_id):
    """生成新闻唯一ID"""
    raw = f"{source_id}:{title}"
    return hashlib.md5(raw.encode('utf-8')).hexdigest()[:12]


def generate_paginated_urls(urls, max_pages=MAX_PAGES):
    """为 URL 列表生成分页变体（中国政府网站常见分页模式）"""
    all_urls = list(urls)  # 第1页（原始URL）
    for url in urls:
        for page in range(1, max_pages):
            if url.endswith('/'):
                all_urls.append(url + f'index_{page}.html')
            elif url.endswith('/index.html'):
                all_urls.append(url.replace('/index.html', f'/index_{page}.html'))
            elif url.endswith('.html'):
                base = url[:-5]
                all_urls.append(f'{base}_{page}.html')
            elif url.endswith('.shtml'):
                base = url[:-6]
                all_urls.append(f'{base}_{page}.shtml')
            else:
                sep = '' if url.endswith('/') else '/'
                all_urls.append(url + sep + f'index_{page}.html')
    return all_urls


def filter_by_date(items, cutoff=DATE_CUTOFF):
    """过滤：仅保留近2月新闻（无日期的也保留）"""
    result = []
    for item in items:
        d = item.get('date', '')
        if not d or d >= cutoff:
            result.append(item)
    return result


# ─────────────────────────────────────────────
# 各网站抓取策略
# ─────────────────────────────────────────────

def scrape_mee(source):
    """生态环境部 - 新闻列表（多页）"""
    base_urls = [
        'https://www.mee.gov.cn/ywdt/szyw/',
        'https://www.mee.gov.cn/ywdt/hjywnews/',
        'https://www.mee.gov.cn/ywdt/dfnews/',
    ]
    items = []
    for base_url in base_urls:
        page_urls = [base_url] + [base_url + f'index_{p}.shtml' for p in range(1, MAX_PAGES)]
        for list_url in page_urls:
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
                summary = ''
                dd = li.select_one('dd')
                if dd:
                    summary = clean_text(dd.get_text())[:200]
                items.append({'title': title, 'url': href, 'date': date_str, 'summary': summary})
                if len(items) >= MAX_NEWS:
                    return items
    return items


def scrape_simple_list(source, news_urls, encoding=None, use_session=False):
    """简单模板：ul > li > a + span"""
    items = []
    for list_url in news_urls:
        html = fetch_page_with_session(list_url, encoding) if use_session else fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('ul li, div.list li, div.newsList li, div.right_list li, div.list-con li'):
            a = li.select_one('a')
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            if not href or href.startswith('javascript'):
                continue
            date_str = ''
            for span in li.select('span, em, i'):
                d = parse_date(span.get_text())
                if d:
                    date_str = d
                    break
            if not date_str:
                date_str = parse_date(href)
            if not date_str:
                date_str = parse_date(li.get_text())
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_dl_list(source, news_urls, encoding=None):
    """复杂模板：dl/dt/dd 风格"""
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
            summary = ''
            dd = li.select_one('dd')
            if dd:
                summary = clean_text(dd.get_text())[:200]
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': summary})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_mobile_list(source, news_urls, encoding=None):
    """通用模板：mobile_list 风格"""
    items = []
    for list_url in news_urls:
        html = fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
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
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_table_list(source, news_urls, encoding=None, use_session=False):
    """表格模板：table > tr > td > a + td.date（山东/宁夏等）"""
    items = []
    for list_url in news_urls:
        html = fetch_page_with_session(list_url, encoding) if use_session else fetch_page(list_url, encoding)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for tr in soup.select('tr'):
            tds = tr.select('td')
            if len(tds) < 2:
                continue
            # 找到包含链接的 td
            a = None
            date_str = ''
            for td in tds:
                link = td.select_one('a[href]')
                if link and not a:
                    title_text = clean_text(link.get('title', '')) or clean_text(link.get_text())
                    if title_text and len(title_text) >= 6:
                        a = link
                else:
                    d = parse_date(clean_text(td.get_text()))
                    if d:
                        date_str = d
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            if not href or href.startswith('javascript'):
                continue
            if not date_str:
                date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_shanghai(source):
    """上海市生态环境局 — 特殊结构（多页）"""
    base = 'https://sthj.sh.gov.cn/hbzhywpt1272/hbzhywpt1157/'
    urls = [base + 'index.html'] + [base + f'index_{p}.html' for p in range(1, MAX_PAGES)]
    items = []
    for list_url in urls:
        html = fetch_page(list_url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        # 上海的结构：li > a[title] + span.date 或 div.list-con li > a
        for li in soup.select('div.list-con li, ul li'):
            a = li.select_one('a[href][title]')
            if not a:
                a = li.select_one('a[href]')
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            if not href or href.startswith('javascript'):
                continue
            date_str = ''
            date_span = li.select_one('span.date')
            if date_span:
                date_str = parse_date(date_span.get_text())
            if not date_str:
                for span in li.select('span'):
                    d = parse_date(span.get_text())
                    if d:
                        date_str = d
                        break
            if not date_str:
                date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_xizang(source):
    """西藏自治区生态环境厅 — 新域名 ee.xizang.gov.cn（多页）"""
    base = 'https://ee.xizang.gov.cn/xwzx/xzxw/'
    page_urls = [base] + [base + f'index_{p}.html' for p in range(1, MAX_PAGES)]
    items = []
    for url in page_urls:
        html = fetch_page(url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        found = 0
        for block in soup.select('div.dj-tr-new'):
            a = block.select_one('span.xwzx-tr-title a, a')
            time_span = block.select_one('span.xwzx-tr-time')
            if not a:
                continue
            title = clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(url, href)
            date_str = parse_date(time_span.get_text()) if time_span else parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            found += 1
            if len(items) >= MAX_NEWS:
                return items
        if found == 0 and url == base:
            # 首页就没找到 dj-tr-new，fallback 到通用 li
            items = scrape_simple_list(source, [base])
            break
    return items


def scrape_jiangxi(source):
    """江西省生态环境厅 — JS 渲染，需从页面提取嵌入数据或用 li 结构"""
    url = 'http://sthjt.jiangxi.gov.cn/jxssthjt/col/col42066/index.html'
    items = []
    html = fetch_page(url)
    if not html:
        return items
    soup = BeautifulSoup(html, 'lxml')
    # 方式 1：尝试 li > a + span.list_span (JS 渲染后的结构)
    for li in soup.select('li'):
        a = li.select_one('a[href*="content"]')
        if not a:
            continue
        title = clean_text(a.get('title', '')) or clean_text(a.get_text())
        if not title or len(title) < 6:
            continue
        href = a.get('href', '')
        if href and not href.startswith('http'):
            href = urljoin(url, href)
        date_str = ''
        span = li.select_one('span.list_span, span')
        if span:
            date_str = parse_date(span.get_text())
        if not date_str:
            date_str = parse_date(href)
        items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
        if len(items) >= MAX_NEWS:
            return items

    # 方式 2：页面中嵌入了 JSON 数据（channelsTagSelf），尝试提取文章 URL
    if not items:
        # 尝试从首页抓取新闻链接
        homepage = 'http://sthjt.jiangxi.gov.cn/jxssthjt/'
        html2 = fetch_page(homepage)
        if html2:
            soup2 = BeautifulSoup(html2, 'lxml')
            for a in soup2.select('a[href*="col42066"], a[href*="col42067"], a[href*="content"]'):
                title = clean_text(a.get('title', '')) or clean_text(a.get_text())
                if not title or len(title) < 6:
                    continue
                href = a.get('href', '')
                if href and not href.startswith('http'):
                    href = urljoin(homepage, href)
                date_str = parse_date(href)
                items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
                if len(items) >= MAX_NEWS:
                    return items
    return items


def scrape_jiangsu(source):
    """江苏省生态环境厅 — 新闻列表页被 CDN 挑战，从首页提取"""
    urls = [
        'http://sthjt.jiangsu.gov.cn/',
    ]
    items = []
    for page_url in urls:
        html = fetch_page(page_url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        # 从首页中提取 /art/YYYY/M/DD/art_XXXXX_XXXXXXX.html 格式的新闻链接
        for a in soup.select('a[href*="/art/"]'):
            href = a.get('href', '')
            if not re.search(r'/art/\d{4}/\d{1,2}/\d{1,2}/art_\d+_\d+\.html', href):
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            if href and not href.startswith('http'):
                href = urljoin(page_url, href)
            date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
    return items


def scrape_hubei(source):
    """湖北省生态环境厅 — WAF 412 防护，用 Session + 多种 URL 尝试"""
    candidate_urls = [
        'http://sthjt.hubei.gov.cn/dtyw/hbyw/',
        'http://sthjt.hubei.gov.cn/dtyw/stdt/',
        'https://sthjt.hubei.gov.cn/dtyw/hbyw/',
        'http://sthjt.hubei.gov.cn/hjsj/ztzl/mlzg/xwbd/',
    ]
    items = []
    for url in candidate_urls:
        html = fetch_page_with_session(url)
        if not html or len(html) < 500:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('ul li, div.list li, tr'):
            a = li.select_one('a[href]')
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(url, href)
            if not href or href.startswith('javascript'):
                continue
            date_str = ''
            for span in li.select('span, em, td'):
                d = parse_date(span.get_text())
                if d:
                    date_str = d
                    break
            if not date_str:
                date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
        if items:
            return items
    return items


def scrape_gansu(source):
    """甘肃省生态环境厅 — WAF 412 防护"""
    candidate_urls = [
        'https://sthj.gansu.gov.cn/sthj/c152440/sthjyw.shtml',
        'http://sthj.gansu.gov.cn/sthj/c152440/sthjyw.shtml',
        'https://sthj.gansu.gov.cn/',
    ]
    items = []
    for url in candidate_urls:
        html = fetch_page_with_session(url)
        if not html or len(html) < 500:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for li in soup.select('ul li, div.list li, tr'):
            a = li.select_one('a[href]')
            if not a:
                continue
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(url, href)
            if not href or href.startswith('javascript'):
                continue
            date_str = ''
            for span in li.select('span, em, td'):
                d = parse_date(span.get_text())
                if d:
                    date_str = d
                    break
            if not date_str:
                date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            if len(items) >= MAX_NEWS:
                return items
        if items:
            return items
    return items


def scrape_hongkong(source):
    """香港环境及生态局 — 新闻稿"""
    urls = [
        'https://www.eeb.gov.hk/tc/eeb_news_events/press_releases/index.html',
        'https://www.epd.gov.hk/epd/tc_chi/news_events/press/press.html',
    ]
    items = []
    for list_url in urls:
        html = fetch_page(list_url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        # EEB 页面：纯文本，日期（DD-MM-YYYY）+ 标题链接
        for a in soup.select('a[href]'):
            href = a.get('href', '')
            title = clean_text(a.get_text())
            if not title or len(title) < 8:
                continue
            # 排除导航链接
            if any(kw in title for kw in ['Home', '主頁', '首頁', 'Back', '返回', 'Skip', '跳至',
                                           'Sitemap', '網頁地圖', '聯絡我們', 'Contact',
                                           '重要告示', 'Important', '私隱政策', 'Privacy',
                                           '无障碍', '繁體版', '简体版', 'English', '更多',
                                           '施政報告', '財政預算案', 'MyGovHK', '香港政府']):
                continue
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            if not href or href.startswith('javascript') or href.startswith('mailto'):
                continue
            # 确认是新闻链接（info.gov.hk/gia 或 press_ 开头）
            if 'info.gov.hk/gia' in href or 'press_' in href or 'news' in href.lower():
                # 尝试从上下文提取日期
                date_str = parse_date(href)
                if not date_str:
                    # EEB 格式：前面的文本节点可能包含 DD-MM-YYYY
                    parent = a.parent
                    if parent:
                        text_before = ''
                        for sibling in parent.children:
                            if sibling == a:
                                break
                            if hasattr(sibling, 'get_text'):
                                text_before += sibling.get_text()
                            elif isinstance(sibling, str):
                                text_before += sibling
                        # DD-MM-YYYY 格式转换
                        m = re.search(r'(\d{2})-(\d{2})-(\d{4})', text_before)
                        if m:
                            date_str = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
                if not date_str:
                    parent_el = a.find_parent()
                    if parent_el:
                        date_str = parse_date(parent_el.get_text())
                items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
                if len(items) >= MAX_NEWS:
                    return items
        if items:
            return items
    return items


def scrape_macau(source):
    """澳门环境保护局 — ASP.NET 新闻列表（多页）"""
    page_urls = [f'https://www.dspa.gov.mo/news.aspx?current_page={p}' for p in range(1, MAX_PAGES + 1)]
    items = []
    for url in page_urls:
        html = fetch_page(url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        found = 0
        for a in soup.select('a[href*="news_detail.aspx"]'):
            title = clean_text(a.get_text())
            if not title or len(title) < 6:
                continue
            href = a.get('href', '')
            if href and not href.startswith('http'):
                href = urljoin(url, href)
            date_str = ''
            parent = a.find_parent()
            if parent:
                for el in parent.find_all(string=True):
                    d = parse_date(str(el))
                    if d:
                        date_str = d
                        break
            if not date_str:
                grandparent = parent.find_parent() if parent else None
                if grandparent:
                    for el in grandparent.find_all(string=True):
                        d = parse_date(str(el))
                        if d:
                            date_str = d
                            break
            if not date_str:
                date_str = parse_date(href)
            items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
            found += 1
            if len(items) >= MAX_NEWS:
                return items
        if found == 0:
            break  # 没有更多页了
    if not items:
        items = scrape_simple_list(source, ['https://www.dspa.gov.mo/news.aspx'])
    return items


def scrape_taiwan(source):
    """台湾地区环境部 — moenv.gov.tw"""
    urls = [
        'https://www.moenv.gov.tw/News',
        'https://enews.moenv.gov.tw/',
        'https://www.moenv.gov.tw/',
    ]
    items = []
    for list_url in urls:
        html = fetch_page(list_url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        # 尝试多种结构
        for a in soup.select('a[href]'):
            href = a.get('href', '')
            title = clean_text(a.get('title', '')) or clean_text(a.get_text())
            if not title or len(title) < 8:
                continue
            # 排除导航
            if any(kw in title for kw in ['首頁', '回首頁', '跳到', 'Skip', ':::',
                                           '網站導覽', '隱私權', '關於本部', '中文版',
                                           'English', '兒童版', '搜尋', '無障礙',
                                           '政府網站資料開放宣告', '資訊安全政策']):
                continue
            if href and not href.startswith('http'):
                href = urljoin(list_url, href)
            if not href or href.startswith('javascript') or href.startswith('#'):
                continue
            # 新闻链接特征
            if any(kw in href.lower() for kw in ['news', 'press', 'content', 'article', 'detail', '/d/']):
                date_str = parse_date(href)
                if not date_str:
                    parent = a.find_parent()
                    if parent:
                        date_str = parse_date(parent.get_text())
                items.append({'title': title, 'url': href, 'date': date_str, 'summary': ''})
                if len(items) >= MAX_NEWS:
                    return items
        if items:
            return items
    return items


def scrape_generic(source, news_urls, encoding=None):
    """通用抓取策略：自动尝试多种模式"""
    items = scrape_mobile_list(source, news_urls, encoding)
    if len(items) >= 5:
        return items
    items = scrape_dl_list(source, news_urls, encoding)
    if len(items) >= 5:
        return items
    items = scrape_simple_list(source, news_urls, encoding)
    if len(items) >= 3:
        return items
    items = scrape_table_list(source, news_urls, encoding)
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
        'scraper': 'shanghai',
        'urls': [],
    },
    {
        'id': 'tj', 'name': '天津市生态环境局', 'shortName': '天津',
        'region': '天津', 'category': 'municipality',
        'scraper': 'generic',
        'urls': ['https://sthj.tj.gov.cn/ZWXX808/HBYW1316/'],
    },
    {
        'id': 'cq', 'name': '重庆市生态环境局', 'shortName': '重庆',
        'region': '重庆', 'category': 'municipality',
        'scraper': 'simple',
        'urls': ['https://sthjj.cq.gov.cn/zwxx_249/zwdt/bmdt/'],
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
        'scraper': 'jiangsu',
        'urls': [],
    },
    {
        'id': 'zj', 'name': '浙江省生态环境厅', 'shortName': '浙江',
        'region': '浙江', 'category': 'province',
        'scraper': 'generic',
        'urls': ['https://sthjt.zj.gov.cn/col/col1229429478/index.html'],
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
        'scraper': 'jiangxi',
        'urls': [],
    },
    {
        'id': 'sd', 'name': '山东省生态环境厅', 'shortName': '山东',
        'region': '山东', 'category': 'province',
        'scraper': 'table',
        'urls': ['http://sthj.shandong.gov.cn/dtxx/hbyw/'],
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
        'scraper': 'hubei',
        'urls': [],
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
        'urls': ['https://gdee.gd.gov.cn/hbxw/index.html'],
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
        'urls': ['https://sthjt.sc.gov.cn/sthjt/c103878/xwdt_list.shtml'],
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
        'scraper': 'gansu',
        'urls': [],
    },
    {
        'id': 'qh', 'name': '青海省生态环境厅', 'shortName': '青海',
        'region': '青海', 'category': 'province',
        'scraper': 'simple',
        'urls': ['https://sthjt.qinghai.gov.cn/xwzx/szyw/'],
    },

    # ─── 自治区 ───
    {
        'id': 'nmg', 'name': '内蒙古自治区生态环境厅', 'shortName': '内蒙古',
        'region': '内蒙古', 'category': 'autonomous',
        'scraper': 'simple',
        'urls': ['https://sthjt.nmg.gov.cn/sthjdt/zzqsthjdt/'],
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
        'scraper': 'xizang',
        'urls': [],
    },
    {
        'id': 'nx', 'name': '宁夏回族自治区生态环境厅', 'shortName': '宁夏',
        'region': '宁夏', 'category': 'autonomous',
        'scraper': 'table',
        'urls': ['https://sthjt.nx.gov.cn/xwzx/qnxw/'],
    },
    {
        'id': 'xj', 'name': '新疆维吾尔自治区生态环境厅', 'shortName': '新疆',
        'region': '新疆', 'category': 'autonomous',
        'scraper': 'generic',
        'urls': ['https://sthjt.xinjiang.gov.cn/xjepd/xwzxtndt/common_list.shtml'],
    },

    # ─── 台湾地区 ───
    {
        'id': 'tw', 'name': '台湾地区环境部', 'shortName': '台湾',
        'region': '台湾', 'category': 'province',
        'scraper': 'taiwan',
        'urls': [],
    },

    # ─── 特别行政区 ───
    {
        'id': 'hk', 'name': '香港特别行政区环境及生态局', 'shortName': '香港',
        'region': '香港', 'category': 'municipality',
        'scraper': 'hongkong',
        'urls': [],
    },
    {
        'id': 'mo', 'name': '澳门特别行政区环境保护局', 'shortName': '澳门',
        'region': '澳门', 'category': 'municipality',
        'scraper': 'macau',
        'urls': [],
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
    if urls:
        print(f"  URL: {urls[0]}")
    else:
        print(f"  策略: {scraper_type}")

    try:
        # 为通用列表爬虫生成分页 URL（自定义爬虫内部自行分页）
        paged_urls = generate_paginated_urls(urls) if urls else []

        if scraper_type == 'mee':
            items = scrape_mee(source)
        elif scraper_type == 'shanghai':
            items = scrape_shanghai(source)
        elif scraper_type == 'xizang':
            items = scrape_xizang(source)
        elif scraper_type == 'jiangxi':
            items = scrape_jiangxi(source)
        elif scraper_type == 'jiangsu':
            items = scrape_jiangsu(source)
        elif scraper_type == 'hubei':
            items = scrape_hubei(source)
        elif scraper_type == 'gansu':
            items = scrape_gansu(source)
        elif scraper_type == 'hongkong':
            items = scrape_hongkong(source)
        elif scraper_type == 'macau':
            items = scrape_macau(source)
        elif scraper_type == 'taiwan':
            items = scrape_taiwan(source)
        elif scraper_type == 'table':
            items = scrape_table_list(source, paged_urls, encoding)
        elif scraper_type == 'simple':
            items = scrape_simple_list(source, paged_urls, encoding)
        elif scraper_type == 'dl':
            items = scrape_dl_list(source, paged_urls, encoding)
        elif scraper_type == 'mobile':
            items = scrape_mobile_list(source, paged_urls, encoding)
        else:
            items = scrape_generic(source, paged_urls, encoding)

        # 过滤无效项 & 去重
        seen = set()
        valid = []
        for item in items:
            if not item['title'] or item['title'] in seen:
                continue
            if len(item['title']) < 6:
                continue
            if any(kw in item['title'] for kw in ['首页', '返回', '更多', '下一页', '上一页', '>>', '...', '当前位置',
                                                    '网站地图', '政务微信', '政务微博', '无障碍', '简体', '繁體',
                                                    '设为首页', '加入收藏', '信息公开', '办事服务', '数据开放',
                                                    '互动交流', '走近环保', '登录/注册', '蒙古文版', '关于我们']):
                continue
            seen.add(item['title'])
            valid.append(item)

        # 近2月日期过滤
        valid = filter_by_date(valid)
        items = valid[:MAX_NEWS]

        # ─── Fallback 机制：抓取不足时使用预存数据 ───
        if len(items) < 3 and sid in FALLBACK_DATA:
            fallback_items = FALLBACK_DATA[sid]
            print(f"  ⚠️  在线抓取仅 {len(items)} 条，使用 fallback 数据 ({len(fallback_items)} 条)")
            items = filter_by_date(fallback_items)[:MAX_NEWS]

        print(f"  ✅ 成功获取 {len(items)} 条新闻" + (" (fallback)" if sid in FALLBACK_DATA and len(valid) < 3 else ""))
        return items

    except Exception as e:
        print(f"  ❌ 抓取失败: {e}")
        traceback.print_exc()
        if sid in FALLBACK_DATA:
            fallback_items = FALLBACK_DATA[sid]
            print(f"  ⚠️  使用 fallback 数据 ({len(fallback_items)} 条)")
            return filter_by_date(fallback_items)[:MAX_NEWS]
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
            if item['date'] and (not existing['date'] or item['date'] < existing['date']):
                existing['date'] = item['date']
        else:
            title_map[title] = item
    return list(title_map.values())


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


def main():
    print("=" * 60)
    print("  绿讯 - 全国环保新闻抓取程序")
    print(f"  目标: {len(SOURCES)} 个来源, 每源最多 {MAX_NEWS} 条")
    print(f"  时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # 加载 fallback 数据
    load_fallback_data()

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
        time.sleep(0.5)

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


if __name__ == '__main__':
    main()
