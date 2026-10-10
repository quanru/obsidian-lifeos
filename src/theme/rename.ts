import { type App, type TAbstractFile, TFile, TFolder, Notice } from 'obsidian';
import type { PluginSettings } from '../type';
import { normalizeThemePath, isThemeIndex, themeIndexStyle, themeRoots } from './config';
import { themeSettingsMessages } from './messages';

export class ThemeRenameSync {
  private busy = false;
  constructor(
    private app: App,
    private settings: () => PluginSettings,
    private locale: () => string,
  ) {}
  handle = async (file: TAbstractFile, oldPath: string) => {
    const settings = this.settings();
    const m = themeSettingsMessages(this.locale());
    if (this.busy || !settings.useThemeNotes || !settings.useThemeFolderSync) return;
    const old = normalizeThemePath(oldPath);
    const roots = themeRoots(settings);
    if (!roots.some(({ root }) => old.startsWith(`${root}/`) && file.path.startsWith(`${root}/`))) return;
    const oldParts = old.split('/');
    const oldName = oldParts.pop()!;
    const style = themeIndexStyle(settings);
    const planned: { source: TAbstractFile; target: string }[] = [];
    if (file instanceof TFolder) {
      if (oldName === file.name) return;
      // Root folders are configuration, not individual themes.
      if (roots.some(({ root }) => old === root)) return;
      for (const child of file.children) {
        if (!(child instanceof TFile) || !isThemeIndex(child.name, oldName, style)) continue;
        const name =
          style === 'folderName'
            ? `${file.name}.md`
            : child.name === `${oldName}.README.md`
              ? `${file.name}.README.md`
              : child.name;
        if (name !== child.name) planned.push({ source: child, target: `${file.path}/${name}` });
      }
    } else if (file instanceof TFile && style === 'folderName') {
      const parent = file.parent;
      if (
        !parent ||
        !isThemeIndex(oldName, parent.name, style) ||
        file.extension !== 'md' ||
        oldParts.join('/') !== parent.path ||
        file.basename === parent.name
      )
        return;
      planned.push({
        source: parent,
        target: `${parent.parent?.path === '/' ? '' : `${parent.parent?.path}/`}${file.basename}`,
      });
    }
    if (
      planned.some(({ source, target }) => {
        const dest = this.app.vault.getAbstractFileByPath(target);
        return dest && dest !== source;
      })
    ) {
      new Notice(m.conflict);
      return;
    }
    this.busy = true;
    try {
      for (const { source, target } of planned) await this.app.fileManager.renameFile(source, target);
    } catch {
      new Notice(m.failed);
    } finally {
      this.busy = false;
    }
  };
}
