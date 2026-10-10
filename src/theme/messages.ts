import translations from './translations.json';
import { normalizeWorkspaceLocale } from '../onboarding/locale';
const en = {
  modeHelp: 'Capture in daily notes and organize by topic without PARA.',
  modeNotFor: 'A workflow that needs separate project, area, resource and archive folders.',
  modeFlow: 'Capture → associate a theme → open its records and tasks.',
  defaultFolder: 'Themes',
  title: 'Theme notes',
  enable: 'Enable theme notes',
  para: 'Use PARA',
  folder: 'Theme folder',
  sync: 'Sync folder and index names',
  syncHelp: 'Rename the index with its folder. In folder-name mode, renaming the index also renames its folder.',
  advanced: 'Advanced settings',
  index: 'Index filename',
  template: 'Theme template',
  search: 'Search theme lists',
  empty: 'No matching themes.',
  create: 'Create theme',
  invalid: 'Use a valid tag, a relative folder and a matching Markdown index filename.',
  conflict: 'The destination already exists. No files were overwritten.',
  unavailable: 'Theme notes are disabled.',
  failed: 'Could not create or rename the theme. Check the destination and try again.',
};
const zh = {
  modeHelp: '在日记中记录，按主题组织内容，无需 PARA。',
  modeNotFor: '需要分别维护项目、领域、资源与归档目录的工作流。',
  modeFlow: '快速记录 → 关联主题 → 查看相关记录与任务。',
  defaultFolder: '主题',
  title: '主题笔记',
  enable: '启用主题笔记',
  para: '使用 PARA',
  folder: '主题目录',
  sync: '同步文件夹与索引名称',
  syncHelp: '重命名文件夹时同步索引名称；同名索引模式下，重命名索引也会同步文件夹。',
  advanced: '高级设置',
  index: '索引文件名',
  template: '主题模板',
  search: '主题列表搜索',
  empty: '没有匹配的主题。',
  create: '创建主题',
  invalid: '请输入有效标签、相对目录及符合命名规则的 Markdown 索引文件名。',
  conflict: '目标已存在，未覆盖任何文件。',
  unavailable: '主题笔记未启用。',
  failed: '无法创建或重命名主题，请检查目标位置后重试。',
};
export function themeSettingsMessages(locale: string): typeof en {
  const key = normalizeWorkspaceLocale(locale);
  if (key === 'zh-cn') return zh;
  if (key === 'zh-tw')
    return {
      modeHelp: '在日記中記錄，依主題組織內容，無需 PARA。',
      modeNotFor: '需要分別維護專案、領域、資源與封存目錄的工作流程。',
      modeFlow: '快速記錄 → 連結主題 → 查看相關記錄與任務。',
      defaultFolder: '主題',
      title: '主題筆記',
      enable: '啟用主題筆記',
      para: '使用 PARA',
      folder: '主題目錄',
      sync: '同步資料夾與索引名稱',
      syncHelp: '重新命名資料夾時同步索引名稱；同名索引模式下，重新命名索引也會同步資料夾。',
      advanced: '進階設定',
      index: '索引檔名',
      template: '主題範本',
      search: '主題清單搜尋',
      empty: '沒有符合的主題。',
      create: '建立主題',
      invalid: '請輸入有效標籤、相對目錄及符合規則的 Markdown 索引檔名。',
      conflict: '目標已存在，未覆寫檔案。',
      unavailable: '主題筆記未啟用。',
      failed: '無法建立或重新命名主題，請檢查目標位置後重試。',
    };
  return translations[key as keyof typeof translations] ?? en;
}
