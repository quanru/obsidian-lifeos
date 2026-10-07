import de from '../locales/review-de.json';
import es from '../locales/review-es.json';
import fr from '../locales/review-fr.json';
import pt from '../locales/review-pt.json';
import ja from '../locales/review-ja.json';
import ko from '../locales/review-ko.json';
import ar from '../locales/review-ar.json';
import { normalizeWorkspaceLocale } from '../onboarding/locale';

const EN = {
  command: 'Weekly review',
  title: 'Weekly review',
  week: 'Week',
  current: 'This week',
  previous: 'Last week',
  description:
    'Collect daily records, checked and open tasks, and project notes updated during this ISO week (Monday–Sunday). No Dataview required. Task status reflects the current Markdown; it does not prove when a task was completed. Refresh replaces only the generated section and keeps your reflections.',
  records: 'Daily records',
  done: 'Checked tasks',
  open: 'Open tasks',
  projects: 'Project notes updated this week',
  empty: 'No entries for this section.',
  reflection: 'My reflections',
  prompts: 'What went well?\n\nWhat needs to change?\n\nWhat will I focus on next week?',
  save: 'Save / refresh review',
  saving: 'Saving…',
  saved: 'Weekly review saved.',
  failed: 'Could not prepare the weekly review',
  collision:
    'This note has no valid LifeOS generated section. Your content was kept. Rename the existing note before creating a review.',
  missing:
    'Dataview is not installed. Install it in Settings → Community plugins, then enable it. Setup, quick capture, and weekly review work without it.',
  disabled:
    'Dataview is disabled. Enable it in Settings → Community plugins. Setup, quick capture, and weekly review work without it.',
  indexing: 'Dataview is still preparing its index. Wait a moment, then retry.',
  ready: 'The query could not be rendered. Check the view name and Dataview settings, then retry.',
  retry: 'Retry',
  loading: 'Preparing review…',
};
export type ReviewI18n = typeof EN;
const ZH: ReviewI18n = {
  command: '每周回顾',
  title: '每周回顾',
  week: '回顾范围',
  current: '本周',
  previous: '上周',
  description:
    '汇总本周日记中的记录、已勾选和未完成任务，以及本周更新的项目笔记。按 ISO 周计算，周一至周日，无需 Dataview。任务状态以当前 Markdown 为准，不代表实际完成时间。刷新仅替换自动汇总，保留你填写的总结。',
  records: '日常记录',
  done: '已勾选任务',
  open: '未完成任务',
  projects: '本周更新的项目笔记',
  empty: '暂无内容。',
  reflection: '我的回顾',
  prompts: '这周有哪些进展？\n\n有什么需要调整？\n\n下周最想做好什么？',
  save: '保存 / 刷新回顾',
  saving: '正在保存…',
  saved: '每周回顾已保存。',
  failed: '无法生成每周回顾',
  collision: '这篇笔记没有有效的 LifeOS 自动汇总区域，已有内容已保留。请先重命名原笔记，再创建回顾。',
  missing: '尚未安装 Dataview。请在“设置 → 第三方插件”中安装并启用。初始化、快速记录和每周回顾无需 Dataview。',
  disabled: 'Dataview 尚未启用。请在“设置 → 第三方插件”中启用。初始化、快速记录和每周回顾无需 Dataview。',
  indexing: 'Dataview 正在准备索引，请稍后重试。',
  ready: '查询视图无法显示，请检查视图名称和 Dataview 设置后重试。',
  retry: '重试',
  loading: '正在汇总…',
};
const TW: ReviewI18n = {
  command: '每週回顧',
  title: '每週回顧',
  week: '回顧範圍',
  current: '本週',
  previous: '上週',
  description:
    '彙整本週日記中的記錄、已勾選和未完成任務，以及本週更新的專案筆記。按 ISO 週計算，週一至週日，無需 Dataview。任務狀態以目前 Markdown 為準，不代表實際完成時間。重新整理僅替換自動彙整，保留你填寫的總結。',
  records: '日常記錄',
  done: '已勾選任務',
  open: '未完成任務',
  projects: '本週更新的專案筆記',
  empty: '暫無內容。',
  reflection: '我的回顧',
  prompts: '這週有哪些進展？\n\n有什麼需要調整？\n\n下週最想做好什麼？',
  save: '儲存 / 重新整理回顧',
  saving: '正在儲存…',
  saved: '每週回顧已儲存。',
  failed: '無法產生每週回顧',
  collision: '這篇筆記沒有有效的 LifeOS 自動彙整區域，既有內容已保留。請先重新命名原筆記，再建立回顧。',
  missing: '尚未安裝 Dataview。請在「設定 → 第三方外掛」中安裝並啟用。初始化、快速記錄和每週回顧無需 Dataview。',
  disabled: 'Dataview 尚未啟用。請在「設定 → 第三方外掛」中啟用。初始化、快速記錄和每週回顧無需 Dataview。',
  indexing: 'Dataview 正在準備索引，請稍後重試。',
  ready: '查詢檢視無法顯示，請檢查檢視名稱和 Dataview 設定後重試。',
  retry: '重試',
  loading: '正在彙整…',
};
export function getReviewI18n(locale?: string): ReviewI18n {
  const normalized = normalizeWorkspaceLocale(locale);
  if (normalized === 'zh-cn') return ZH;
  if (normalized === 'zh-tw') return TW;
  return { de, es, fr, pt, ja, ko, ar }[normalized as 'de' | 'es' | 'fr' | 'pt' | 'ja' | 'ko' | 'ar'] || EN;
}
