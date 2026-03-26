"""
绿讯 Scraper Service — 数据库写入模块
负责将爬取的新闻数据写入 PostgreSQL
"""
import os
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime


DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://lvxun:lvxun_2026@localhost:5432/lvxun"
)


def get_connection():
    """获取数据库连接"""
    return psycopg2.connect(DATABASE_URL)


def upsert_news(items: list[dict]) -> tuple[int, int]:
    """
    批量写入新闻到数据库（UPSERT）
    返回 (total_processed, new_inserted)
    """
    if not items:
        return 0, 0

    conn = get_connection()
    cur = conn.cursor()

    total = len(items)
    new_count = 0

    try:
        for item in items:
            # 解析日期
            date_val = None
            if item.get("date"):
                try:
                    date_val = datetime.strptime(item["date"], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    date_val = None

            source = item.get("source", {})
            source_id = source.get("id", "")
            tags = item.get("tags", [])
            category = item.get("category", "环保资讯")

            try:
                cur.execute(
                    """
                    INSERT INTO news (id, title, url, date, summary, source_id, category, tags, merged, view_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        date = EXCLUDED.date,
                        category = EXCLUDED.category,
                        tags = EXCLUDED.tags,
                        updated_at = NOW()
                    RETURNING (xmax = 0) AS is_new
                    """,
                    (
                        item.get("id", ""),
                        item.get("title", ""),
                        item.get("url", ""),
                        date_val,
                        item.get("summary", ""),
                        source_id,
                        category,
                        tags,
                        item.get("merged", False),
                        0,
                    ),
                )
                row = cur.fetchone()
                if row and row[0]:
                    new_count += 1
            except psycopg2.IntegrityError:
                conn.rollback()
                continue

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[DB ERROR] 写入失败: {e}")
        raise
    finally:
        cur.close()
        conn.close()

    return total, new_count


def log_scrape(source_id: str, started_at, ended_at, items_found: int, items_new: int, status: str, error_msg: str = None):
    """记录爬取日志"""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO scrape_logs (source_id, started_at, ended_at, items_found, items_new, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (source_id, started_at, ended_at, items_found, items_new, status, error_msg),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[DB ERROR] 日志写入失败: {e}")
    finally:
        cur.close()
        conn.close()


def get_existing_urls() -> set:
    """获取数据库中已有的新闻 URL（用于去重）"""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT url FROM news")
        return {row[0] for row in cur.fetchall()}
    finally:
        cur.close()
        conn.close()
