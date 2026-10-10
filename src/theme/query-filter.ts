import type { App } from 'obsidian';
import type { PluginSettings } from '../type';
import { isInPeriodicNote, FULL_DAILY_REG } from '../periodic/paths';
import { captureRecordLines } from '../capture/record-sections';
import { isInTemplateNote } from '../util';
import { identifyTheme } from '../capture/theme-model';

/** Use the same heading boundaries as Quick Capture for daily-note query rows. */
export async function themeRowFilter(app: App, settings: PluginSettings, paths: string[], sourcePath: string) {
  const eligible = new Map<string, Set<number>>();
  for (const path of new Set(paths)) {
    if (!FULL_DAILY_REG.test(path) || !isInPeriodicNote(path, settings)) continue;
    const file = app.vault.getFileByPath(path);
    if (!file) continue;
    eligible.set(
      path,
      captureRecordLines(await app.vault.cachedRead(file), settings.dailyRecordHeader, settings.habitHeader),
    );
  }
  return (row: { path: string; line: number; section?: { subpath?: string } }) => {
    if (row.path === sourcePath || isInTemplateNote(row.path, settings) || identifyTheme(row.path, settings))
      return false;
    const lines = eligible.get(row.path);
    if (lines) return lines.has(row.line);
    return row.section?.subpath?.trim() !== settings.habitHeader?.trim();
  };
}
