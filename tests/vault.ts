import type { App } from 'obsidian';
import { TFile, TFolder } from './obsidian';
import type { PluginSettings } from '../src/type';

export const settings = {
  periodicNotesPath: 'Journal',
  dailyNoteFormat: 'YYYY-MM-DD',
  weeklyNoteFormat: 'gggg-[W]ww',
  monthlyNoteFormat: 'YYYY-MM',
  quarterlyNoteFormat: 'YYYY-[Q]Q',
  yearlyNoteFormat: 'YYYY',
  dailyRecordHeader: 'Daily Record',
  projectsPath: 'Projects',
  areasPath: 'Areas',
  resourcesPath: 'Resources',
  archivesPath: 'Archives',
  projectListHeader: 'Projects',
  habitHeader: 'Habits',
  useThemeNotes: true,
  useThemeFolderSync: true,
  useThemeAdvanced: false,
  themesPath: 'Themes',
  themeIndexFilename: 'readme',
  usePARANotes: true,
} as PluginSettings;

export function memoryApp() {
  const entries = new Map<string, TFile | TFolder>();
  const contents = new Map<string, string>();
  const events = new Map<object, () => void>();
  const processQueues = new Map<string, Promise<unknown>>();
  function add(file: TFile | TFolder) {
    entries.set(file.path, file);
    const parent = entries.get(file.path.split('/').slice(0, -1).join('/'));
    if (parent instanceof TFolder) parent.children.push(file);
  }
  const app = {
    vault: {
      adapter: {
        exists: async (path: string) => entries.has(path),
        stat: async (path: string) =>
          entries.has(path) ? { type: entries.get(path) instanceof TFolder ? 'folder' : 'file' } : null,
        read: async (path: string) => contents.get(path)!,
        write: async (path: string, content: string) => {
          if (!entries.has(path)) add(new TFile(path));
          contents.set(path, content);
        },
        mkdir: async (path: string) => {
          add(new TFolder(path));
        },
      },
      getAbstractFileByPath: (path: string) => entries.get(path) ?? null,
      on: (_name: string, callback: () => void) => {
        const ref = {};
        events.set(ref, callback);
        return ref;
      },
      getFileByPath: (path: string) => (entries.get(path) instanceof TFile ? entries.get(path) : null),
      getMarkdownFiles: () => [...entries.values()].filter((file): file is TFile => file instanceof TFile),
      createFolder: async (path: string) => {
        if (entries.has(path)) throw new Error('Already exists');
        add(new TFolder(path));
      },
      create: async (path: string, content: string) => {
        if (entries.has(path)) throw new Error('Already exists');
        const file = new TFile(path);
        add(file);
        contents.set(path, content);
        return file;
      },
      read: async (file: TFile) => contents.get(file.path)!,
      cachedRead: async (file: TFile) => contents.get(file.path)!,
      process: async (file: TFile, update: (content: string) => string) => {
        const previous = processQueues.get(file.path) ?? Promise.resolve();
        const next = previous
          .catch(() => {})
          .then(() => {
            contents.set(file.path, update(contents.get(file.path)!));
          });
        processQueues.set(file.path, next);
        await next;
      },
    },
    fileManager: {
      processFrontMatter: async () => {},
      trashFile: async (file: TFile | TFolder) => {
        entries.delete(file.path);
        contents.delete(file.path);
        const parent = entries.get(file.path.split('/').slice(0, -1).join('/'));
        if (parent instanceof TFolder) parent.children = parent.children.filter((child) => child !== file);
      },
    },
    workspace: { getLeaf: () => ({ openFile: async () => {} }) },
    plugins: {
      manifests: {} as Record<string, unknown>,
      enabledPlugins: new Set<string>(),
      plugins: {} as Record<string, { api?: unknown }>,
    },
    metadataCache: {
      on: (_name: string, callback: () => void) => {
        const ref = {};
        events.set(ref, callback);
        return ref;
      },
      offref: (ref: object) => {
        events.delete(ref);
      },
    },
  };
  return { app: app as unknown as App, state: app, entries, contents, events };
}
