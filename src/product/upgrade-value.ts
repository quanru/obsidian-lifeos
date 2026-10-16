import { normalizeWorkspaceLocale } from '../onboarding/locale';

const copy = {
  en: {
    free: 'Capture, tasks, themes and basic queries are fully usable for free. Keep using them as long as they meet your needs.',
    title: 'When is Pro useful?',
    intro: 'Consider Pro when reviewing lists turns into daily planning and coordination.',
    freeLabel: 'Open source',
    proLabel: 'LifeOS Pro',
    scenarios: [
      [
        'Plan a busy week',
        'Capture tasks and review unfinished items by theme.',
        'Schedule tasks in the calendar and see them alongside your plans.',
      ],
      [
        'Find items in longer lists',
        'Collect tasks, records and resources by theme.',
        'Search, sort and filter advanced lists instead of scanning them one by one.',
      ],
      [
        'Coordinate several projects',
        'Organize each project with themes or PARA.',
        'Use the home workflow view to review projects from input to delivery.',
      ],
    ],
    boundary:
      'AI requires the separate DeepAsk plugin and your own supported model service or CLI. Buying LifeOS Pro alone does not include AI.',
  },
  'zh-cn': {
    free: '记录、任务、主题和基础查询均完整免费。当前功能够用，就可以继续使用开源版。',
    title: '什么时候值得用 Pro？',
    intro: '当查看列表变成每天的排期和统筹工作时，可以考虑 Pro。',
    freeLabel: '开源版',
    proLabel: 'LifeOS Pro',
    scenarios: [
      ['安排忙碌的一周', '记下任务，按主题查看未完成事项。', '在日历中安排任务，把待办和时间计划放在一起查看。'],
      ['从长列表里找到重点', '按主题汇总任务、记录和资料。', '在高级列表中搜索、排序、过滤，减少逐条翻找。'],
      ['统筹多个项目', '用普通主题或 PARA 分别整理项目。', '在主页工作流视图中查看项目从输入到交付的进展。'],
    ],
    boundary: 'AI 功能需要另购 DeepAsk，并配置自己的模型服务或受支持的 CLI；单独购买 LifeOS Pro 不包含 AI。',
  },
  'zh-tw': {
    free: '記錄、任務、主題和基本查詢均完整免費。目前功能夠用，就可以繼續使用開源版。',
    title: '什麼時候值得用 Pro？',
    intro: '當查看清單變成每天的排程和統籌工作時，可以考慮 Pro。',
    freeLabel: '開源版',
    proLabel: 'LifeOS Pro',
    scenarios: [
      ['安排忙碌的一週', '記下任務，按主題查看未完成事項。', '在日曆中安排任務，把待辦和時間計畫放在一起查看。'],
      ['從長清單裡找到重點', '按主題彙整任務、記錄和資料。', '在進階清單中搜尋、排序、篩選，減少逐條翻找。'],
      ['統籌多個專案', '用一般主題或 PARA 分別整理專案。', '在首頁工作流程檢視中查看專案從輸入到交付的進展。'],
    ],
    boundary: 'AI 功能需要另購 DeepAsk，並設定自己的模型服務或支援的 CLI；單獨購買 LifeOS Pro 不包含 AI。',
  },
};

export function upgradeValue(locale: string) {
  const key = normalizeWorkspaceLocale(locale);
  return copy[key as keyof typeof copy] || copy.en;
}
