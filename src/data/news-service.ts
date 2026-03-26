import type { NewsItem, NewsFilter, PaginatedResult } from '@/types/news'
import { newsSources } from './sources'

// 新闻分类
const categories = ['政策法规', '污染防治', '生态保护', '环境监测', '绿色发展', '国际合作', '科技创新', '公众参与']

// 标签池（预留扩展使用）
const _tagPool = [
  '碳中和', '碳达峰', '蓝天保卫战', '长江保护', '黄河流域', '生物多样性',
  '土壤污染', '水污染治理', '大气污染', '固废处理', '新能源', '循环经济',
  '环评审批', '排污许可', '绿色金融', '生态补偿', 'ESG', '清洁能源',
  '垃圾分类', '海洋保护', '湿地保护', '荒漠化治理', '野生动物保护'
]
void _tagPool

const images = ['/images/news-1.png', '/images/news-2.png', '/images/news-3.png']

// ─── 模拟新闻数据生成 ───
const mockTitles: Array<{ title: string; summary: string; content: string; category: string; tags: string[] }> = [
  {
    title: '生态环境部发布2026年全国空气质量改善目标',
    summary: '生态环境部今日发布关于进一步加强大气污染防治的指导意见，明确2026年全国地级及以上城市空气质量优良天数比率目标。',
    content: `<p>生态环境部今日发布《关于进一步加强大气污染防治工作的指导意见》，明确了2026年全国地级及以上城市空气质量优良天数比率达到88%以上的工作目标。</p>
<p>《指导意见》从优化产业结构、推进能源清洁化、加强机动车污染防治、强化区域联防联控四个方面提出了具体措施。其中，在产业结构优化方面，要求各地加快淘汰落后产能，推动重点行业超低排放改造。</p>
<p>生态环境部大气环境司负责人表示，今年将加大对京津冀及周边地区、汾渭平原、长三角等重点区域的督查力度，确保各项措施落实到位。同时，还将推动建立区域大气污染防治协作机制，实现信息共享和联合执法。</p>
<p>据了解，2025年全国地级及以上城市空气质量优良天数比率已达到87.5%，PM2.5平均浓度同比下降3.2%。此次新目标的设定，体现了我国持续改善环境空气质量的决心和信心。</p>`,
    category: '污染防治',
    tags: ['大气污染', '蓝天保卫战', '碳达峰']
  },
  {
    title: '长江流域水生态环境保护取得显著成效',
    summary: '最新监测数据显示，长江干流水质已连续五年保持Ⅱ类标准，流域生物多样性持续恢复，珍稀物种种群数量稳步增长。',
    content: `<p>据生态环境部最新发布的监测数据，长江干流水质已连续五年保持Ⅱ类标准，流域内优良水体（Ⅰ—Ⅲ类）断面比例达到98.2%，较2020年提升了6.8个百分点。</p>
<p>在生物多样性保护方面，长江十年禁渔政策成效显著。长江江豚种群数量从2017年的1012头增长至目前的约1350头，中华鲟人工繁殖和放流规模逐年扩大。多个曾经消失的鱼类品种重新出现在长江水域中。</p>
<p>在产业转型方面，沿江11省市累计关闭搬迁化工企业超过8600家，腾退长江岸线162公里，建成生态廊道和滨水绿地面积超过5000公顷。长江经济带绿色发展指数持续提升。</p>`,
    category: '生态保护',
    tags: ['长江保护', '生物多样性', '水污染治理']
  },
  {
    title: '全国碳排放权交易市场累计成交额突破500亿元',
    summary: '全国碳市场运行三年来交易日趋活跃，累计成交额突破500亿元大关，碳定价机制在推动企业绿色转型方面发挥重要作用。',
    content: `<p>全国碳排放权交易市场自2021年启动以来，经过三年多的发展，累计成交额突破500亿元大关。最新数据显示，2026年第一季度碳配额成交均价为每吨89.5元，同比上涨15.3%。</p>
<p>目前，全国碳市场已覆盖电力、钢铁、水泥、铝冶炼四个重点行业，纳入重点排放单位超过5200家，覆盖年碳排放量约60亿吨，约占全国碳排放总量的60%。</p>
<p>碳定价机制正在有效推动企业加快绿色低碳转型。据统计，纳入碳市场管理的企业，单位产品碳排放强度平均下降了12.8%，绿色低碳技术投入同比增长35%。</p>`,
    category: '绿色发展',
    tags: ['碳中和', '碳达峰', '绿色金融']
  },
  {
    title: '北京市空气质量持续向好 PM2.5年均浓度再创新低',
    summary: '北京市生态环境局发布数据显示，2025年北京市PM2.5年均浓度为28微克/立方米，同比下降6.7%，连续三年达到国家标准。',
    content: `<p>北京市生态环境局今日发布2025年度空气质量报告。数据显示，全年PM2.5年均浓度为28微克/立方米，同比下降6.7%，连续三年达到国家二级标准（35微克/立方米）。</p>
<p>报告指出，2025年北京市优良天数达到293天，占比80.3%，重污染天数仅有3天。其中，夏季空气质量最为优异，6至8月PM2.5平均浓度仅为18微克/立方米。</p>
<p>北京市通过持续推进能源清洁化、机动车电动化、扬尘精细化管控等措施，空气质量实现了质的飞跃。目前，全市新能源汽车保有量突破120万辆，占比达到18.5%。</p>`,
    category: '污染防治',
    tags: ['大气污染', '蓝天保卫战', 'PM2.5']
  },
  {
    title: '我国首个深海生态修复试验项目启动',
    summary: '由自然资源部和生态环境部联合推动的首个深海生态修复试验项目在南海正式启动，将探索深海珊瑚礁修复的新技术路径。',
    content: `<p>我国首个深海生态修复试验项目今日在南海正式启动。该项目由自然资源部和生态环境部联合推动，计划在南海选取三处典型深海珊瑚礁区域进行生态修复试验。</p>
<p>项目将采用人工珊瑚礁基、珊瑚断枝移植、微生物群落优化等多种技术手段，探索适合我国深海环境的珊瑚礁修复方案。预计试验周期为5年，总投资约3.2亿元。</p>
<p>深海珊瑚礁是重要的海洋生态系统，支撑着丰富的海洋生物多样性。近年来，受气候变化和人类活动影响，全球深海珊瑚礁面临严峻挑战。此次试验项目的启动，标志着我国在深海生态保护领域迈出了重要一步。</p>`,
    category: '生态保护',
    tags: ['海洋保护', '生物多样性', '科技创新']
  },
  {
    title: '浙江省率先实现工业固废"零填埋"目标',
    summary: '浙江省生态环境厅宣布，全省已实现一般工业固体废物"零填埋"目标，综合利用率达到99.2%，为全国固废治理提供了样板。',
    content: `<p>浙江省生态环境厅今日宣布，全省已实现一般工业固体废物"零填埋"目标，综合利用率达到99.2%，在全国率先完成这一里程碑。</p>
<p>据介绍，浙江省通过"源头减量、过程控制、末端利用"三位一体的治理模式，构建了覆盖全省的工业固废收集、运输、处置体系。全省共建成工业固废处置利用设施372座，年处置能力达到1.2亿吨。</p>
<p>浙江还创新推出了"固废银行"制度，企业可以通过固废交换平台实现废弃物的资源化利用。目前，全省已有超过8000家企业入驻平台，累计交易固废超过3600万吨。</p>`,
    category: '污染防治',
    tags: ['固废处理', '循环经济', '绿色发展']
  },
  {
    title: '黄河流域生态保护修复工程全面推进',
    summary: '黄河流域生态保护和高质量发展重大工程取得积极进展，已完成水土流失治理面积1.8万平方公里，湿地修复面积120万亩。',
    content: `<p>黄河流域生态保护和高质量发展国家战略实施以来，各项重大工程全面推进，取得积极进展。截至目前，已完成水土流失治理面积1.8万平方公里，湿地修复面积120万亩。</p>
<p>在上游水源涵养方面，三江源、祁连山等重点生态功能区的生态环境持续改善，草地覆盖率提高5.3个百分点。在中游水土保持方面，黄土高原地区植被覆盖度从世纪初的31.6%提升至目前的65.4%。</p>
<p>在下游湿地保护方面，黄河三角洲国家级自然保护区湿地面积恢复至1820平方公里，鸟类种类由建区初期的283种增至目前的373种。</p>`,
    category: '生态保护',
    tags: ['黄河流域', '湿地保护', '生态补偿']
  },
  {
    title: '广东省推出全国首个省级碳普惠自愿减排机制',
    summary: '广东省生态环境厅发布碳普惠自愿减排机制管理办法，鼓励公众通过绿色出行、节能减排等行为获取碳积分奖励。',
    content: `<p>广东省生态环境厅今日发布《广东省碳普惠自愿减排机制管理办法》，这是全国首个省级碳普惠自愿减排机制，旨在鼓励公众积极参与低碳行动。</p>
<p>根据管理办法，公众可以通过绿色出行、使用新能源、节约用电用水、参与垃圾分类等低碳行为获取碳积分。碳积分可在合作商家兑换优惠，也可捐赠用于生态保护项目。</p>
<p>广东省已与支付宝、微信等平台合作，开发碳普惠小程序，方便公众记录和管理个人碳足迹。试运行期间，已有超过500万用户注册，累计减排量达到12万吨二氧化碳当量。</p>`,
    category: '公众参与',
    tags: ['碳中和', '绿色金融', '公众参与']
  },
  {
    title: '新版环境影响评价法修订草案公开征求意见',
    summary: '生态环境部就《中华人民共和国环境影响评价法（修订草案征求意见稿）》向社会公开征求意见，拟强化全过程环境管理。',
    content: `<p>生态环境部今日发布公告，就《中华人民共和国环境影响评价法（修订草案征求意见稿）》向社会公开征求意见。此次修订是该法自2002年颁布以来的第三次重大修订。</p>
<p>修订草案主要在以下方面进行了完善：一是强化规划环评的约束力和指导作用；二是优化建设项目环评分类管理，实行差异化管理；三是加强环评全过程监管，建立环评质量追溯制度；四是加大违法行为处罚力度。</p>
<p>征求意见期限为30天，社会各界可通过信函或电子邮件方式提出意见和建议。生态环境部将认真研究各方面意见，进一步修改完善草案内容。</p>`,
    category: '政策法规',
    tags: ['环评审批', '政策法规', '排污许可']
  },
  {
    title: '全国环境监测网络智能化升级完成',
    summary: '生态环境部宣布全国环境监测网络智能化升级工程全面完成，新增AI辅助分析能力，可实现环境异常的自动识别和预警。',
    content: `<p>生态环境部今日宣布，全国环境监测网络智能化升级工程已全面完成。升级后的监测网络覆盖了空气、水体、土壤、噪声、辐射五大环境要素，监测站点总数超过12000个。</p>
<p>此次升级的核心是引入AI辅助分析系统。该系统可以实时分析监测数据，自动识别环境异常情况，并在10分钟内发出预警。试运行期间，系统已成功预警了53起环境异常事件。</p>
<p>此外，升级后的监测网络还实现了数据的实时共享。公众可以通过"生态环境监测"App查看全国任意监测站点的实时数据，了解身边的环境质量状况。</p>`,
    category: '环境监测',
    tags: ['环境监测', '科技创新', '大数据']
  },
  {
    title: '中国与东盟签署生物多样性保护合作框架协议',
    summary: '在第六届中国-东盟环境部长会议上，双方签署了生物多样性保护合作框架协议，将共同推进跨境自然保护区建设。',
    content: `<p>在今日举行的第六届中国-东盟环境部长会议上，中国与东盟十国共同签署了《中国-东盟生物多样性保护合作框架协议》。这是中国与区域组织签署的首个生物多样性保护专项合作协议。</p>
<p>框架协议明确了五个重点合作领域：跨境自然保护区网络建设、珍稀濒危物种联合保护、海洋生物多样性保护、传统生物资源可持续利用、以及生物多样性监测技术合作。</p>
<p>中方承诺在未来五年内提供10亿元人民币的合作资金，用于支持东盟国家开展生物多样性保护项目。首批合作项目包括中越跨境自然保护区建设和中缅金丝猴联合保护计划。</p>`,
    category: '国际合作',
    tags: ['生物多样性', '国际合作', '野生动物保护']
  },
  {
    title: '我国新型光伏发电技术转化效率突破世界纪录',
    summary: '中国科学院宣布，我国自主研发的钙钛矿-硅叠层太阳能电池转化效率达到34.6%，刷新世界纪录。',
    content: `<p>中国科学院今日宣布，由其下属研究所自主研发的钙钛矿-硅叠层太阳能电池实验室转化效率达到34.6%，刷新了此前由德国团队保持的33.9%的世界纪录。</p>
<p>这一突破性成果得益于团队开发的新型界面修饰技术，有效解决了钙钛矿材料在大面积制备过程中的稳定性问题。该技术已申请国际专利，预计2027年可实现量产。</p>
<p>与传统硅基太阳能电池相比，叠层电池可以更高效地利用太阳光谱，理论转化效率上限可达46%。这一技术的突破将大幅降低光伏发电成本，加速我国能源结构绿色转型。</p>`,
    category: '科技创新',
    tags: ['清洁能源', '新能源', '科技创新']
  },
  {
    title: '山东省建成全国最大海上风电集群',
    summary: '山东省渤海湾海上风电集群全面投产运营，总装机容量达到1200万千瓦，年发电量可满足600万户家庭用电需求。',
    content: `<p>山东省渤海湾海上风电集群今日全面投产运营。该集群总装机容量达到1200万千瓦，是目前全国最大的海上风电集群项目。</p>
<p>据测算，该集群年发电量约为350亿千瓦时，可满足约600万户家庭一年的用电需求，每年可替代标准煤约1050万吨，减少二氧化碳排放约2700万吨。</p>
<p>山东省计划到2030年，全省海上风电装机容量达到3500万千瓦，打造千亿级海上风电产业集群，为实现碳达峰碳中和目标提供有力支撑。</p>`,
    category: '绿色发展',
    tags: ['清洁能源', '新能源', '碳中和']
  },
  {
    title: '四川大熊猫国家公园生态廊道建设取得突破',
    summary: '四川省宣布大熊猫国家公园内8条关键生态廊道已全部贯通，有效连接了13个大熊猫栖息地种群。',
    content: `<p>四川省林业和草原局今日宣布，大熊猫国家公园内8条关键生态廊道已全部贯通，有效连接了13个大熊猫栖息地种群，为大熊猫的基因交流和种群扩展创造了条件。</p>
<p>生态廊道建设总长度达到286公里，涉及植被恢复面积12万亩。在廊道建设过程中，同步实施了社区共管、生态移民等配套措施，惠及当地居民2.8万人。</p>
<p>红外相机监测数据显示，生态廊道建成后，已记录到大熊猫通过廊道在不同栖息地间活动的影像136次，证明廊道已发挥预期效果。</p>`,
    category: '生态保护',
    tags: ['野生动物保护', '生物多样性', '生态补偿']
  },
  {
    title: '江苏省推行"绿岛"模式破解中小企业治污难题',
    summary: '江苏省创新推出"绿岛"集中治污模式，已建成287个绿岛项目，帮助2.6万家中小企业实现达标排放。',
    content: `<p>江苏省生态环境厅今日发布数据，全省已建成287个"绿岛"项目，帮助2.6万家中小企业实现了污染物达标排放。"绿岛"模式已成为破解中小企业治污难题的有效路径。</p>
<p>所谓"绿岛"，是指由政府投资或多个市场主体共同建设、共享的环保公共基础设施。中小企业无需自建治污设施，只需将污染物送往就近的"绿岛"集中处理，大幅降低了治污成本。</p>
<p>据测算，"绿岛"模式平均为每家企业每年节约治污成本约15万元，总计为全省中小企业节约投入超过40亿元。同时，集中治污效率更高，污染物削减率平均提升20%以上。</p>`,
    category: '污染防治',
    tags: ['污染防治', '绿色发展', '循环经济']
  },
  {
    title: '生态环境部通报2026年一季度重点区域空气质量状况',
    summary: '2026年一季度，全国339个地级及以上城市平均空气质量优良天数比率为82.1%，同比上升2.3个百分点。',
    content: `<p>生态环境部今日通报2026年一季度全国环境空气质量状况。全国339个地级及以上城市平均空气质量优良天数比率为82.1%，同比上升2.3个百分点；PM2.5平均浓度为38微克/立方米，同比下降5.0%。</p>
<p>重点区域中，京津冀及周边地区优良天数比率为68.5%，同比上升4.1个百分点；长三角地区优良天数比率为86.3%，同比上升1.8个百分点；汾渭平原优良天数比率为62.7%，同比上升3.5个百分点。</p>
<p>生态环境部相关负责人表示，一季度空气质量改善得益于产业结构优化和清洁能源替代的持续推进，以及有利的气象条件。</p>`,
    category: '环境监测',
    tags: ['大气污染', '环境监测', '蓝天保卫战']
  },
]

// 为每个来源分配新闻
function generateSourceNews(sourceIndex: number): NewsItem[] {
  const source = newsSources[sourceIndex % newsSources.length]
  const startIndex = (sourceIndex * 3) % mockTitles.length
  const newsCount = 2 + (sourceIndex % 3) // 每个来源 2~4 条
  const result: NewsItem[] = []

  for (let i = 0; i < newsCount; i++) {
    const mockData = mockTitles[(startIndex + i) % mockTitles.length]
    const dayOffset = Math.floor(Math.random() * 14)
    const date = new Date(2026, 2, 26 - dayOffset)
    const dateStr = date.toISOString().split('T')[0]

    result.push({
      id: `${source.id}-${i}-${Date.now()}`,
      title: mockData.title,
      summary: mockData.summary,
      content: mockData.content,
      source,
      publishDate: dateStr,
      category: mockData.category,
      imageUrl: images[i % images.length],
      originalUrl: `${source.url}/news/${dateStr.replace(/-/g, '')}/${i}`,
      tags: mockData.tags,
      viewCount: Math.floor(Math.random() * 5000) + 200,
      merged: false,
    })
  }
  return result
}

// 新闻去重合并逻辑：标题完全一致视为同一新闻
function deduplicateNews(allNews: NewsItem[]): NewsItem[] {
  const titleMap = new Map<string, NewsItem>()

  for (const item of allNews) {
    const existing = titleMap.get(item.title)
    if (existing) {
      // 合并来源
      existing.merged = true
      if (!existing.mergedSources) {
        existing.mergedSources = [existing.source]
      }
      if (!existing.mergedSources.find(s => s.id === item.source.id)) {
        existing.mergedSources.push(item.source)
      }
      // 保留最早的发布日期
      if (item.publishDate < existing.publishDate) {
        existing.publishDate = item.publishDate
      }
      existing.viewCount += item.viewCount
    } else {
      titleMap.set(item.title, { ...item })
    }
  }

  return Array.from(titleMap.values())
}

// 生成所有模拟数据
let _allNews: NewsItem[] | null = null

function getAllNews(): NewsItem[] {
  if (_allNews) return _allNews

  const allRaw: NewsItem[] = []
  for (let i = 0; i < newsSources.length; i++) {
    allRaw.push(...generateSourceNews(i))
  }
  _allNews = deduplicateNews(allRaw)
  // 按日期排序
  _allNews.sort((a, b) => b.publishDate.localeCompare(a.publishDate))
  return _allNews
}

// ─── 公开 API ───

/** 获取新闻列表（支持筛选/分页） */
export function fetchNews(filter: NewsFilter): PaginatedResult<NewsItem> {
  let items = getAllNews()

  // 按地区筛选
  if (filter.region) {
    items = items.filter(n => {
      if (n.source.region === filter.region) return true
      if (n.mergedSources?.some(s => s.region === filter.region)) return true
      return false
    })
  }

  // 按来源筛选
  if (filter.source) {
    items = items.filter(n => {
      if (n.source.id === filter.source) return true
      if (n.mergedSources?.some(s => s.id === filter.source)) return true
      return false
    })
  }

  // 按分类筛选
  if (filter.category) {
    items = items.filter(n => n.category === filter.category)
  }

  // 关键词搜索
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    items = items.filter(n =>
      n.title.toLowerCase().includes(kw) ||
      n.summary.toLowerCase().includes(kw) ||
      n.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  // 时间范围
  if (filter.dateRange) {
    items = items.filter(n =>
      n.publishDate >= filter.dateRange!.start &&
      n.publishDate <= filter.dateRange!.end
    )
  }

  const total = items.length
  const totalPages = Math.ceil(total / filter.pageSize)
  const start = (filter.page - 1) * filter.pageSize
  const paged = items.slice(start, start + filter.pageSize)

  return { items: paged, total, page: filter.page, pageSize: filter.pageSize, totalPages }
}

/** 获取单条新闻 */
export function fetchNewsById(id: string): NewsItem | undefined {
  return getAllNews().find(n => n.id === id)
}

/** 获取热门新闻 */
export function fetchHotNews(count: number = 6): NewsItem[] {
  return getAllNews()
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, count)
}

/** 获取最新新闻 */
export function fetchLatestNews(count: number = 8): NewsItem[] {
  return getAllNews().slice(0, count)
}

/** 获取相关新闻 */
export function fetchRelatedNews(newsId: string, count: number = 5): NewsItem[] {
  const target = fetchNewsById(newsId)
  if (!target) return []

  return getAllNews()
    .filter(n => n.id !== newsId)
    .filter(n =>
      n.category === target.category ||
      n.tags.some(t => target.tags.includes(t))
    )
    .slice(0, count)
}

/** 获取统计数据 */
export function fetchStats() {
  const all = getAllNews()
  const today = '2026-03-26'
  return {
    totalSources: newsSources.length,
    totalNews: all.length,
    todayNews: all.filter(n => n.publishDate === today).length,
    provinces: new Set(newsSources.map(s => s.region)).size,
    categories: [...new Set(all.map(n => n.category))],
  }
}

/** 获取所有分类 */
export function getCategories(): string[] {
  return categories
}