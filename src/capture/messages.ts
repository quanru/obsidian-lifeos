import ar from '../locales/capture-ar.json';
import de from '../locales/capture-de.json';
import es from '../locales/capture-es.json';
import fr from '../locales/capture-fr.json';
import ja from '../locales/capture-ja.json';
import ko from '../locales/capture-ko.json';
import pt from '../locales/capture-pt.json';
import { normalizeWorkspaceLocale } from '../onboarding/locale';
const en = {
  title: 'Quick capture',
  description:
    'Keep ideas, images and tasks in your daily notes. Ctrl/Cmd + Enter to save.',
  record: 'Record',
  task: 'Task',
  placeholder: 'An idea, an update, or something to do…',
  save: 'Save',
  saving: 'Saving…',
  source: 'Markdown',
  preview: 'Preview',
  bold: 'Bold',
  italic: 'Italic',
  checkbox: 'Checklist',
  image: 'Add image',
  link: 'Link a note',
  search: 'Search records',
  tags: 'Filter by tags',
  from: 'From date',
  to: 'To date',
  clear: 'Clear filters',
  history: 'Recent records',
  empty: 'No records yet. Write your first one above.',
  noResults: 'No matching records.',
  more: 'Load more',
  loading: 'Loading…',
  end: 'All matching records loaded',
  edit: 'Edit',
  remove: 'Delete',
  open: 'Open daily note',
  cancel: 'Cancel',
  deleteTitle: 'Delete this record?',
  deleteHint:
    'This removes the record from its daily note. Other content and attachments are kept.',
  fullscreen: 'Full screen',
  restore: 'Exit full screen',
  failed: 'Could not complete the operation',
  conflict:
    'This record changed in its daily note. Refresh and try again; your draft is still here.',
  refresh: 'Refresh',
  imageLimit: 'Choose an image smaller than 20 MB.',
  count: 'records',
};
export type CaptureMessages = typeof en;
const zh: CaptureMessages = {
  title: '快速记录',
  description: '把想法、图片和任务记进日记。按 Ctrl/Cmd + Enter 保存。',
  record: '记录',
  task: '任务',
  placeholder: '记下一个想法、进展或待办…',
  save: '保存',
  saving: '正在保存…',
  source: 'Markdown',
  preview: '预览',
  bold: '加粗',
  italic: '斜体',
  checkbox: '任务清单',
  image: '添加图片',
  link: '关联笔记',
  search: '搜索记录',
  tags: '按标签筛选',
  from: '开始日期',
  to: '结束日期',
  clear: '清除筛选',
  history: '最近的记录',
  empty: '还没有记录，先在上方写一条吧。',
  noResults: '没有符合条件的记录。',
  more: '加载更多',
  loading: '正在加载…',
  end: '符合条件的记录已全部显示',
  edit: '编辑',
  remove: '删除',
  open: '打开日记',
  cancel: '取消',
  deleteTitle: '删除这条记录？',
  deleteHint: '这条记录会从日记中移除，其他内容和图片附件会保留。',
  fullscreen: '全屏',
  restore: '退出全屏',
  failed: '操作失败',
  conflict: '日记中的这条记录已经变化。请刷新后重试，输入草稿仍会保留。',
  refresh: '刷新',
  imageLimit: '请选择小于 20 MB 的图片。',
  count: '条记录',
};
const tw: CaptureMessages = {
  title: '快速記錄',
  description: '把想法、圖片和任務記進日記。按 Ctrl/Cmd + Enter 儲存。',
  record: '記錄',
  task: '任務',
  placeholder: '記下一個想法、進展或待辦…',
  save: '儲存',
  saving: '正在儲存…',
  source: 'Markdown',
  preview: '預覽',
  bold: '粗體',
  italic: '斜體',
  checkbox: '任務清單',
  image: '新增圖片',
  link: '關聯筆記',
  search: '搜尋記錄',
  tags: '依標籤篩選',
  from: '開始日期',
  to: '結束日期',
  clear: '清除篩選',
  history: '最近的記錄',
  empty: '還沒有記錄，先在上方寫一條吧。',
  noResults: '沒有符合條件的記錄。',
  more: '載入更多',
  loading: '正在載入…',
  end: '符合條件的記錄已全部顯示',
  edit: '編輯',
  remove: '刪除',
  open: '開啟日記',
  cancel: '取消',
  deleteTitle: '刪除這條記錄？',
  deleteHint: '這條記錄會從日記中移除，其他內容和圖片附件會保留。',
  fullscreen: '全螢幕',
  restore: '退出全螢幕',
  failed: '操作失敗',
  conflict: '日記中的這條記錄已經變更。請重新整理後再試，輸入草稿仍會保留。',
  refresh: '重新整理',
  imageLimit: '請選擇小於 20 MB 的圖片。',
  count: '條記錄',
};
export function captureMessages(locale: string): CaptureMessages {
  const key = normalizeWorkspaceLocale(locale);
  if (key === 'zh-cn') return zh;
  if (key === 'zh-tw') return tw;
  return (
    { de, es, fr, pt, ja, ko, ar }[
      key as 'de' | 'es' | 'fr' | 'pt' | 'ja' | 'ko' | 'ar'
    ] || en
  );
}
