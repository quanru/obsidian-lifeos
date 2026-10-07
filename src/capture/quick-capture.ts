import dayjs from 'dayjs';
import { type App, TFile } from 'obsidian';
import { DAILY } from '../constant';
import type { PluginSettings } from '../type';
import { createPeriodicFile } from '../util';
import { withVaultLock } from '../vault-lock';
import {
  type QuickCaptureKind,
  appendUnderHeading,
  formatCaptureEntry,
} from './content';

export async function captureToToday(
  app: App,
  settings: PluginSettings,
  locale: string,
  kind: QuickCaptureKind,
  text: string,
  openSource = true,
): Promise<TFile> {
  const dailyFile = await createPeriodicFile(
    dayjs(),
    DAILY,
    settings,
    app,
    false,
    locale,
  );

  if (!(dailyFile instanceof TFile)) {
    throw new Error(
      'The daily note or its template is unavailable. Run “Set up workspace” first.',
    );
  }

  const lines = formatCaptureEntry(kind, text, dayjs().format('HH:mm')).split(
    '\n',
  );
  // Stable Obsidian block IDs distinguish repeated captures without a separate database.
  lines[0] += ` ^capture-${crypto.randomUUID()}`;
  const entry = lines.join('\n');
  await withVaultLock(app.vault, () =>
    app.vault.process(dailyFile, (content) =>
      appendUnderHeading(content, settings.dailyRecordHeader, entry),
    ),
  );

  if (openSource) await app.workspace.getLeaf(false).openFile(dailyFile);
  return dailyFile;
}
