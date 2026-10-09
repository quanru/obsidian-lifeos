import dayjs from 'dayjs';
import { type App, MarkdownView, Notice, TFile } from 'obsidian';
import { DAILY } from '../constant';
import type { PluginSettings } from '../type';
import { createPeriodicFile } from '../util';
import { recordCursor } from './record-cursor';

export async function openTodayRecords(app: App, settings: PluginSettings, locale: string, unavailable: string) {
  const file = await createPeriodicFile(dayjs(), DAILY, settings, app, false, locale);
  if (!(file instanceof TFile)) {
    new Notice(unavailable);
    return;
  }
  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  if (leaf.view instanceof MarkdownView) {
    if (leaf.view.getMode() === 'preview') {
      await leaf.view.setState({ mode: 'source', source: false }, { history: false });
    }
    const cursor = recordCursor(leaf.view.editor.getValue(), settings.dailyRecordHeader);
    leaf.view.editor.setCursor(cursor);
    leaf.view.editor.scrollIntoView({ from: cursor, to: cursor }, true);
    leaf.view.editor.focus();
  }
}
