import dayjs, { type Dayjs } from 'dayjs';
import { type App, TFile, TFolder, normalizePath } from 'obsidian';
import { periodicLocation } from '../periodic/calendar';
import type { PluginSettings } from '../type';
import { withVaultLock } from '../vault-lock';
import { type ReviewData, collectDailyEntries, renderReview, updateReview } from './content';
import { getReviewI18n } from './i18n';

export async function collectWeeklyReview(app: App, settings: PluginSettings, date: Dayjs): Promise<ReviewData> {
  const start = date.startOf('isoWeek');
  const end = start.add(6, 'day');
  const data: ReviewData = {
    from: start.format('YYYY-MM-DD'),
    to: end.format('YYYY-MM-DD'),
    records: [],
    done: [],
    open: [],
    projects: [],
  };
  for (let offset = 0; offset < 7; offset++) {
    const path = normalizePath(periodicLocation(start.add(offset, 'day'), 'Daily', settings).file);
    const file = app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) continue;
    const entries = collectDailyEntries(file.path, await app.vault.cachedRead(file), settings.dailyRecordHeader);
    data.records.push(...entries.records);
    data.done.push(...entries.done);
    data.open.push(...entries.open);
  }
  if (settings.usePARANotes && settings.projectsPath) {
    const root = normalizePath(settings.projectsPath);
    const template = normalizePath(settings.projectsTemplateFilePath || `${root}/Template.md`);
    for (const file of app.vault.getMarkdownFiles().sort((a, b) => a.path.localeCompare(b.path))) {
      if (!file.path.startsWith(`${root}/`) || file.path === template || file.name === 'Template.md') continue;
      const modified = dayjs(file.stat.mtime);
      if (
        modified.valueOf() >= start.startOf('day').valueOf() &&
        modified.valueOf() < end.add(1, 'day').startOf('day').valueOf()
      ) {
        const project = file.path.slice(root.length + 1).split('/')[0];
        const label = /(?:^|\.)README$/i.test(file.basename) ? project : `${project} / ${file.basename}`;
        data.projects.push({ path: file.path, text: label });
      }
    }
  }
  return data;
}

export function weeklyReviewPath(date: Dayjs, settings: PluginSettings): string {
  return normalizePath(periodicLocation(date, 'Weekly', settings).file.replace(/\.md$/, '-Review.md'));
}

export async function saveWeeklyReview(
  app: App,
  settings: PluginSettings,
  date: Dayjs,
  locale: string,
): Promise<TFile> {
  const data = await collectWeeklyReview(app, settings, date);
  const t = getReviewI18n(locale);
  const generated = renderReview(data, t);
  const path = weeklyReviewPath(date, settings);
  const file = await withVaultLock(app.vault, async () => {
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await app.vault.process(existing, (content) => updateReview(content, generated, t));
      return existing;
    }
    if (existing) throw new Error(t.collision);
    const segments = path.split('/').slice(0, -1);
    let parent = '';
    for (const segment of segments) {
      parent = parent ? `${parent}/${segment}` : segment;
      const folder = app.vault.getAbstractFileByPath(parent);
      if (folder && !(folder instanceof TFolder)) throw new Error(t.collision);
      if (!folder) await app.vault.createFolder(parent);
    }
    return app.vault.create(path, updateReview(undefined, generated, t));
  });
  await app.workspace.getLeaf(false).openFile(file);
  return file;
}
