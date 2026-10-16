import { type App, TFile, TFolder, normalizePath } from 'obsidian';
import type { PluginSettings } from '../type';
import { withVaultLock } from '../vault-lock';
import { getBasicTemplatePlans } from './templates';

/** Prepare only the daily template; do not lock the vault into a workspace mode. */
export function prepareQuickCapture(app: App, settings: PluginSettings, locale: string): Promise<void> {
  const plan = getBasicTemplatePlans(settings, 'periodic', locale).find(
    (item) => item.path.endsWith('/Daily.md') || item.path === settings.periodicNotesTemplateFilePathDaily,
  );
  if (!plan) return Promise.reject(new Error('Daily template path is unavailable'));
  return withVaultLock(app.vault, async () => {
    const existing = app.vault.getAbstractFileByPath(plan.path);
    if (existing instanceof TFile) return;
    if (existing) throw new Error('Daily template path is occupied by a folder');
    if (settings.usePeriodicAdvanced && settings.periodicNotesTemplateFilePathDaily)
      throw new Error('The configured daily template is missing. Choose a template in settings first.');
    const parts = normalizePath(plan.path).split('/');
    parts.pop();
    let folder = '';
    for (const part of parts) {
      folder = folder ? `${folder}/${part}` : part;
      const entry = app.vault.getAbstractFileByPath(folder);
      if (entry && !(entry instanceof TFolder)) throw new Error(`A folder is required: ${folder}`);
    }
    folder = '';
    for (const part of parts) {
      folder = folder ? `${folder}/${part}` : part;
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
    }
    await app.vault.create(plan.path, plan.content);
  });
}
