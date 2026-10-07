import { type App, parseYaml } from 'obsidian';
import type { PluginSettings } from '../type';
import { type CaptureTheme, identifyTheme, themeTags } from './theme-model';

export async function captureThemes(
  app: App,
  settings: PluginSettings,
): Promise<CaptureTheme[]> {
  if (!settings.usePARANotes) return [];
  const themes: CaptureTheme[] = [];
  for (const file of app.vault.getMarkdownFiles()) {
    const theme = identifyTheme(file.path, settings);
    if (!theme) continue;
    const content = await app.vault.cachedRead(file);
    const yaml = content.match(
      /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)(?:\r?\n|$)/,
    )?.[1];
    if (!yaml) continue;
    try {
      const metadata = parseYaml(yaml);
      const tags = themeTags(metadata?.tags);
      if (tags.length) themes.push({ ...theme, tags });
    } catch {
      /* An invalid theme must not hide all other valid themes. */
    }
  }
  return themes.sort((a, b) => a.name.localeCompare(b.name));
}
