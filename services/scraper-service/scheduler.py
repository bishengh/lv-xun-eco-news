#!/usr/bin/env python3
"""
绿讯 Scraper Service — 定时调度器
每天早上 8:00 自动执行新闻抓取任务
"""
import os
import signal
import sys
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# 时区配置（默认 Asia/Shanghai）
TIMEZONE = os.environ.get("TZ", "Asia/Shanghai")
# 调度时间（默认 08:00）
CRON_HOUR = int(os.environ.get("CRON_HOUR", "8"))
CRON_MINUTE = int(os.environ.get("CRON_MINUTE", "0"))
# 是否启动时立即执行一次
RUN_ON_START = os.environ.get("RUN_ON_START", "false").lower() == "true"


def run_scraper():
    """执行抓取任务"""
    print(f"\n{'🕐' * 20}")
    print(f"[SCHEDULER] 开始定时抓取任务: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'🕐' * 20}\n")

    try:
        from scraper import main
        main()
        print(f"\n[SCHEDULER] 抓取任务完成: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    except Exception as e:
        print(f"\n[SCHEDULER] 抓取任务出错: {e}")
        import traceback
        traceback.print_exc()


def graceful_shutdown(signum, frame):
    """优雅退出"""
    print(f"\n[SCHEDULER] 收到信号 {signum}，正在关闭...")
    sys.exit(0)


def main():
    # 注册信号处理
    signal.signal(signal.SIGTERM, graceful_shutdown)
    signal.signal(signal.SIGINT, graceful_shutdown)

    print("=" * 60)
    print("  绿讯 Scraper 定时调度器")
    print(f"  调度时间: 每天 {CRON_HOUR:02d}:{CRON_MINUTE:02d} ({TIMEZONE})")
    print(f"  启动时执行: {'是' if RUN_ON_START else '否'}")
    print(f"  当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 启动时立即执行一次（可选）
    if RUN_ON_START:
        run_scraper()

    # 配置定时任务
    scheduler = BlockingScheduler(timezone=TIMEZONE)
    scheduler.add_job(
        run_scraper,
        trigger=CronTrigger(hour=CRON_HOUR, minute=CRON_MINUTE, timezone=TIMEZONE),
        id="daily_scrape",
        name="每日新闻抓取",
        misfire_grace_time=3600,  # 允许 1 小时的延迟触发
        max_instances=1,
    )

    print(f"\n[SCHEDULER] 调度器已启动，等待下次触发...")
    try:
        job = scheduler.get_job('daily_scrape')
        print(f"[SCHEDULER] 下次执行时间: {getattr(job, 'next_run_time', None) or f'每天 {CRON_HOUR:02d}:{CRON_MINUTE:02d}'}")
    except Exception:
        print(f"[SCHEDULER] 定时任务已注册: 每天 {CRON_HOUR:02d}:{CRON_MINUTE:02d}")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n[SCHEDULER] 调度器已关闭")


if __name__ == "__main__":
    main()
