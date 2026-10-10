import type { App } from 'obsidian';
import type { PluginSettings } from '../type';
import { identifyTheme, themeTags } from '../capture/theme-model';
export function themeIndexNotes(app: App, settings: PluginSettings, dir = settings.themesPath, tags: string[] = []) {
  const root = (dir || '').replace(/\/$/, '');
  return app.vault
    .getMarkdownFiles()
    .flatMap((file) => {
      const theme = identifyTheme(file.path, settings);
      if (!theme || !root || !file.path.startsWith(`${root}/`)) return [];
      const fileTags = themeTags(app.metadataCache.getFileCache(file)?.frontmatter?.tags);
      if (tags.length && !fileTags.some((tag) => tags.some((value) => tag === value || tag.startsWith(`${value}/`))))
        return [];
      return [{ ...theme, tags: fileTags, file }];
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path));
}
export function themeSnapshot(app: App, settings: PluginSettings, dir = settings.themesPath) {
  return themeIndexNotes(app, settings, dir)
    .map((note, index) => `${index + 1}. [[${note.path}|${note.name}]]`)
    .join('\n');
}
