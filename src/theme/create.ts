import { type App, TFile } from 'obsidian';
import type { PluginSettings } from '../type';
import { createFile, joinVaultPath } from '../util';
import { buildThemeTemplate } from './templates';
import { themeRoots, themeIndexStyle, isThemeIndex } from './config';
import { themeSettingsMessages } from './messages';
import { themeTags } from '../capture/theme-model';

export function themeCreationPlan(
  settings: PluginSettings,
  kind: string,
  fields: { tag: string; folder: string; index: string },
) {
  const root = themeRoots(settings).find((item) => item.kind === kind)?.root;
  const folder = fields.folder?.trim();
  const index = fields.index?.trim();
  if (
    settings.useThemeNotes === false ||
    !root ||
    !folder ||
    folder.split('/').some((p) => !p || p === '.' || p === '..') ||
    /[\\:#\[\]|]/.test(folder) ||
    !index ||
    /[/\\:#\[\]|]/.test(index) ||
    !isThemeIndex(index, folder.split('/').slice(-1)[0], themeIndexStyle(settings)) ||
    themeTags(fields.tag).length !== 1 ||
    !/^#[\p{L}\p{N}_/-]+$/u.test(fields.tag)
  )
    return;
  const custom = settings[`${kind}sTemplateFilePath` as keyof PluginSettings];
  const advanced = kind === 'theme' ? settings.useThemeAdvanced : settings.usePARAAdvanced;
  return {
    folder: joinVaultPath(root, folder),
    file: joinVaultPath(root, folder, index),
    templateFile: advanced && typeof custom === 'string' && custom ? custom : joinVaultPath(root, 'Template.md'),
    tag: fields.tag,
  };
}
export async function createThemeNote(
  app: App,
  settings: PluginSettings,
  locale: string,
  kind: string,
  fields: { tag: string; folder: string; index: string },
) {
  const m = themeSettingsMessages(locale);
  const plan = themeCreationPlan(settings, kind, fields);
  if (!plan) throw new Error(m.invalid);
  const fallback =
    plan.templateFile === joinVaultPath(themeRoots(settings).find((item) => item.kind === kind)!.root, 'Template.md')
      ? buildThemeTemplate(locale)
      : undefined;
  const created = await createFile(app, { ...plan, locale, requireNew: true, fallbackContent: fallback });
  if (!(created instanceof TFile)) throw new Error(m.failed);
  return created;
}
