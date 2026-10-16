import { type App, TFile, Notice } from 'obsidian';
import { normalizeWorkspaceLocale } from '../onboarding/locale';

export function queryHelpMessages(locale: string) {
  const key = normalizeWorkspaceLocale(locale);
  return key === 'zh-cn'
    ? {
        plugins: '打开第三方插件设置',
        edit: '编辑主题标签',
        tags: '主题笔记还没有有效标签。在笔记属性中填写 tags，例如 learn/typescript，再给相关记录或资料添加同样的标签。',
        settingsHelp: '请打开设置 → 第三方插件，搜索 Dataview 并安装、启用。',
      }
    : key === 'zh-tw'
      ? {
          plugins: '開啟第三方外掛設定',
          edit: '編輯主題標籤',
          tags: '主題筆記尚未設定有效標籤。在筆記屬性中填寫 tags，例如 learn/typescript，再為相關記錄或資料加上相同標籤。',
          settingsHelp: '請開啟設定 → 第三方外掛，搜尋 Dataview 並安裝、啟用。',
        }
      : {
          plugins: 'Open community plugin settings',
          edit: 'Edit theme tags',
          tags: 'This theme has no valid tags yet. Add tags such as learn/typescript to its note properties, then use the same tags on related records or resources.',
          settingsHelp: 'Open Settings → Community plugins, find Dataview, then install and enable it.',
        };
}

export function openCommunityPluginSettings(app: App, locale: string) {
  const settings = (app as App & { setting?: { open(): void; openTabById(id: string): unknown } }).setting;
  if (!settings?.open || !settings.openTabById) {
    new Notice(queryHelpMessages(locale).settingsHelp);
    return;
  }
  settings.open();
  settings.openTabById('community-plugins');
}

export function renderMissingThemeTags(app: App, container: HTMLElement, sourcePath: string, locale: string) {
  const m = queryHelpMessages(locale);
  const box = container.createDiv('lifeos-dependency-message');
  box.createEl('p', { text: m.tags });
  const button = box.createEl('button', { text: m.edit });
  button.onclick = async () => {
    if (!(app.vault.getAbstractFileByPath(sourcePath) instanceof TFile)) return;
    await app.workspace
      .getLeaf(false)
      .setViewState({ type: 'markdown', state: { file: sourcePath, mode: 'source' }, active: true });
  };
}
