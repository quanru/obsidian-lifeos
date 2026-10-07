import dayjs from 'dayjs';
import { type App, TFile, normalizePath } from 'obsidian';
import { periodicLocation } from '../periodic/calendar';
import { normalizePeriodicNotesPath } from '../periodic/paths';
import type { PluginSettings } from '../type';
import { withVaultLock } from '../vault-lock';
import {
  type CaptureRecord,
  readCaptureRecords,
  replaceCaptureRecord,
} from './history';

export class CaptureRepository {
  private revisions = new Map<string, number>();
  private generation = 0;
  private cache = new Map<
    string,
    { mtime: number; records: CaptureRecord[] }
  >();
  constructor(
    private readonly app: App,
    private readonly settings: PluginSettings,
  ) {}

  invalidate(path?: string): void {
    if (path) {
      this.cache.delete(path);
      this.revisions.set(path, (this.revisions.get(path) ?? 0) + 1);
    } else {
      this.cache.clear();
      this.generation++;
    }
  }

  private dateOf(file: TFile): string | undefined {
    const folder = normalizePeriodicNotesPath(this.settings.periodicNotesPath);
    const root = folder ? `${folder}/` : '';
    if (!file.path.startsWith(root)) return;
    const match = file.path
      .slice(root.length)
      .match(/^(\d{4})\/Daily\/(\d{2})\/[^/]+\.md$/);
    if (!match) return;
    // Resolve even custom daily filenames without treating other periodic notes as captures.
    for (let day = 1; day <= 31; day++) {
      const date = dayjs(
        `${match[1]}-${match[2]}-${String(day).padStart(2, '0')}`,
      );
      if (date.format('MM') !== match[2]) continue;
      if (
        normalizePath(periodicLocation(date, 'Daily', this.settings).file) ===
        file.path
      )
        return date.format('YYYY-MM-DD');
    }
  }

  async list(): Promise<CaptureRecord[]> {
    const files = this.app.vault.getMarkdownFiles();
    const present = new Set(files.map((f) => f.path));
    for (const path of this.cache.keys())
      if (!present.has(path)) this.cache.delete(path);
    const records: CaptureRecord[] = [];
    for (const file of files) {
      const date = this.dateOf(file);
      if (!date) continue;
      let cached = this.cache.get(file.path);
      if (!cached || cached.mtime !== file.stat.mtime) {
        const mtime = file.stat.mtime;
        const revision = this.revisions.get(file.path);
        const generation = this.generation;
        const text = await this.app.vault.cachedRead(file);
        cached = {
          mtime,
          records: readCaptureRecords(
            text,
            file.path,
            date,
            this.settings.dailyRecordHeader,
          ),
        };
        if (
          revision === this.revisions.get(file.path) &&
          generation === this.generation
        )
          this.cache.set(file.path, cached);
      }
      records.push(...cached.records);
    }
    return records.sort(
      (a, b) => b.date.localeCompare(a.date) || b.line - a.line,
    );
  }

  async replace(
    record: CaptureRecord,
    replacement: string | null,
  ): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile))
      throw new Error('The source daily note is unavailable.');
    await withVaultLock(this.app.vault, () =>
      this.app.vault.process(file, (current) =>
        replaceCaptureRecord(
          current,
          record,
          this.settings.dailyRecordHeader,
          replacement,
        ),
      ),
    );
    this.invalidate(record.path);
  }

  async open(record: CaptureRecord): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(record.path);
    if (!(file instanceof TFile))
      throw new Error('The source daily note is unavailable.');
    await this.app.workspace
      .getLeaf(false)
      .openFile(file, { eState: { line: record.line } });
  }
}
