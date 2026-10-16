import { normalizeWorkspaceLocale } from '../onboarding/locale';
const en = {
  title: 'Upgrade theme queries',
  help: 'Choose the changes to apply to this note. Standard queries will use LifeOSOpen, and TaskListByTag will show unfinished tasks. Custom queries and other content are preserved.',
  empty: 'No standard queries need upgrading. Custom queries are kept as written.',
  apply: 'Apply selected changes',
  cancel: 'Cancel',
  before: 'Before',
  after: 'After',
  line: 'Line',
  stale: 'The note changed after the preview. Review the updated preview before applying.',
  failed: 'Could not read or update this note. Check access and try again.',
  done: 'Theme queries updated.',
  loading: 'Reading note…',
  refresh: 'Refresh preview',
};
const zh: typeof en = {
  title: '升级主题查询',
  help: '请选择要应用到当前笔记的改动。标准查询会改用 LifeOSOpen，TaskListByTag 会改为只显示未完成任务。自定义查询和其他内容保留。',
  empty: '没有需要升级的标准查询。自定义查询保持原样。',
  apply: '应用所选改动',
  cancel: '取消',
  before: '修改前',
  after: '修改后',
  line: '行',
  stale: '预览后笔记发生了变化，请检查新的预览再应用。',
  failed: '无法读取或更新笔记，请检查访问权限后重试。',
  done: '主题查询已更新。',
  loading: '正在读取笔记…',
  refresh: '刷新预览',
};
const tw: typeof en = {
  title: '升級主題查詢',
  help: '請選擇要套用到目前筆記的變更。標準查詢會改用 LifeOSOpen，TaskListByTag 會改為只顯示未完成任務。自訂查詢與其他內容保留。',
  empty: '沒有需要升級的標準查詢。自訂查詢維持原樣。',
  apply: '套用所選變更',
  cancel: '取消',
  before: '修改前',
  after: '修改後',
  line: '行',
  stale: '預覽後筆記已變更，請檢查新的預覽再套用。',
  failed: '無法讀取或更新筆記，請檢查存取權限後重試。',
  done: '主題查詢已更新。',
  loading: '正在讀取筆記…',
  refresh: '重新整理預覽',
};
export function themeUpgradeMessages(locale: string): typeof en {
  const key = normalizeWorkspaceLocale(locale);
  return key === 'zh-cn' ? zh : key === 'zh-tw' ? tw : en;
}
