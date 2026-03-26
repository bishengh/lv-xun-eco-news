import type { NewsSource } from '@/types/news'

/**
 * 全国生态环境新闻来源配置
 * 包含生态环境部和 32 个省/自治区/直辖市环保官网
 */
export const newsSources: NewsSource[] = [
  // ─── 国家级 ───
  { id: 'mee', name: '生态环境部', shortName: '生态环境部', region: '全国', url: 'https://www.mee.gov.cn', category: 'national' },

  // ─── 直辖市 ───
  { id: 'bj', name: '北京市生态环境局', shortName: '北京', region: '北京', url: 'https://sthjj.beijing.gov.cn', category: 'municipality' },
  { id: 'sh', name: '上海市生态环境局', shortName: '上海', region: '上海', url: 'https://sthj.sh.gov.cn', category: 'municipality' },
  { id: 'tj', name: '天津市生态环境局', shortName: '天津', region: '天津', url: 'https://sthj.tj.gov.cn', category: 'municipality' },
  { id: 'cq', name: '重庆市生态环境局', shortName: '重庆', region: '重庆', url: 'https://sthjj.cq.gov.cn', category: 'municipality' },

  // ─── 省份 ───
  { id: 'heb', name: '河北省生态环境厅', shortName: '河北', region: '河北', url: 'https://hbepb.hebei.gov.cn', category: 'province' },
  { id: 'sx', name: '山西省生态环境厅', shortName: '山西', region: '山西', url: 'https://sthjt.shanxi.gov.cn', category: 'province' },
  { id: 'ln', name: '辽宁省生态环境厅', shortName: '辽宁', region: '辽宁', url: 'https://sthj.ln.gov.cn', category: 'province' },
  { id: 'jl', name: '吉林省生态环境厅', shortName: '吉林', region: '吉林', url: 'https://sthjt.jl.gov.cn', category: 'province' },
  { id: 'hlj', name: '黑龙江省生态环境厅', shortName: '黑龙江', region: '黑龙江', url: 'https://sthj.hlj.gov.cn', category: 'province' },
  { id: 'js', name: '江苏省生态环境厅', shortName: '江苏', region: '江苏', url: 'https://sthjt.jiangsu.gov.cn', category: 'province' },
  { id: 'zj', name: '浙江省生态环境厅', shortName: '浙江', region: '浙江', url: 'https://sthjt.zj.gov.cn', category: 'province' },
  { id: 'ah', name: '安徽省生态环境厅', shortName: '安徽', region: '安徽', url: 'https://sthjt.ah.gov.cn', category: 'province' },
  { id: 'fj', name: '福建省生态环境厅', shortName: '福建', region: '福建', url: 'https://sthjt.fujian.gov.cn', category: 'province' },
  { id: 'jx', name: '江西省生态环境厅', shortName: '江西', region: '江西', url: 'https://sthjt.jiangxi.gov.cn', category: 'province' },
  { id: 'sd', name: '山东省生态环境厅', shortName: '山东', region: '山东', url: 'https://sthj.shandong.gov.cn', category: 'province' },
  { id: 'hen', name: '河南省生态环境厅', shortName: '河南', region: '河南', url: 'https://sthjt.henan.gov.cn', category: 'province' },
  { id: 'hub', name: '湖北省生态环境厅', shortName: '湖北', region: '湖北', url: 'https://sthjt.hubei.gov.cn', category: 'province' },
  { id: 'hun', name: '湖南省生态环境厅', shortName: '湖南', region: '湖南', url: 'https://sthjt.hunan.gov.cn', category: 'province' },
  { id: 'gd', name: '广东省生态环境厅', shortName: '广东', region: '广东', url: 'https://gdee.gd.gov.cn', category: 'province' },
  { id: 'hi', name: '海南省生态环境厅', shortName: '海南', region: '海南', url: 'https://hnsthj.hainan.gov.cn', category: 'province' },
  { id: 'sc', name: '四川省生态环境厅', shortName: '四川', region: '四川', url: 'https://sthjt.sc.gov.cn', category: 'province' },
  { id: 'gz', name: '贵州省生态环境厅', shortName: '贵州', region: '贵州', url: 'https://sthj.guizhou.gov.cn', category: 'province' },
  { id: 'yn', name: '云南省生态环境厅', shortName: '云南', region: '云南', url: 'https://sthjt.yn.gov.cn', category: 'province' },
  { id: 'sxn', name: '陕西省生态环境厅', shortName: '陕西', region: '陕西', url: 'https://sthjt.shaanxi.gov.cn', category: 'province' },
  { id: 'gs', name: '甘肃省生态环境厅', shortName: '甘肃', region: '甘肃', url: 'https://sthj.gansu.gov.cn', category: 'province' },
  { id: 'qh', name: '青海省生态环境厅', shortName: '青海', region: '青海', url: 'https://sthjt.qinghai.gov.cn', category: 'province' },
  { id: 'tw', name: '台湾地区', shortName: '台湾', region: '台湾', url: '', category: 'province' },

  // ─── 自治区 ───
  { id: 'nmg', name: '内蒙古自治区生态环境厅', shortName: '内蒙古', region: '内蒙古', url: 'https://sthjt.nmg.gov.cn', category: 'autonomous' },
  { id: 'gx', name: '广西壮族自治区生态环境厅', shortName: '广西', region: '广西', url: 'https://sthjt.gxzf.gov.cn', category: 'autonomous' },
  { id: 'xz', name: '西藏自治区生态环境厅', shortName: '西藏', region: '西藏', url: 'https://sthjt.xizang.gov.cn', category: 'autonomous' },
  { id: 'nx', name: '宁夏回族自治区生态环境厅', shortName: '宁夏', region: '宁夏', url: 'https://sthjt.nx.gov.cn', category: 'autonomous' },
  { id: 'xj', name: '新疆维吾尔自治区生态环境厅', shortName: '新疆', region: '新疆', url: 'https://sthjt.xinjiang.gov.cn', category: 'autonomous' },

  // ─── 特别行政区 ───
  { id: 'hk', name: '香港特别行政区环境及生态局', shortName: '香港', region: '香港', url: 'https://www.eeb.gov.hk', category: 'municipality' },
  { id: 'mo', name: '澳门特别行政区环境保护局', shortName: '澳门', region: '澳门', url: 'https://www.dspa.gov.mo', category: 'municipality' },
]

/** 获取所有来源地区列表（去重） */
export function getRegions(): string[] {
  const regions = newsSources.map(s => s.region)
  return [...new Set(regions)]
}

/** 按 category 分组 */
export function getSourcesByCategory() {
  return {
    national: newsSources.filter(s => s.category === 'national'),
    municipality: newsSources.filter(s => s.category === 'municipality'),
    province: newsSources.filter(s => s.category === 'province'),
    autonomous: newsSources.filter(s => s.category === 'autonomous'),
  }
}