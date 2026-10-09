import { markdownLines } from '../markdown-lines';
import type { PluginSettings } from '../type';

export type ThemeKind = 'project' | 'area' | 'resource' | 'archive';
export interface CaptureTheme {
  path: string;
  name: string;
  kind: ThemeKind;
  tags: string[];
}
export function themeTags(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\s,，]+/) : [];
  return [
    ...new Set(
      values
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().replace(/^#+/, ''))
        .filter((tag) => /^[\p{L}\p{N}_/-]+$/u.test(tag) && /[\p{L}_/-]/u.test(tag)),
    ),
  ];
}
export function identifyTheme(path: string, settings: PluginSettings): Omit<CaptureTheme, 'tags'> | undefined {
  const normalize = (value: string) => value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const templates = [
    settings.projectsTemplateFilePath,
    settings.areasTemplateFilePath,
    settings.resourcesTemplateFilePath,
    settings.archivesTemplateFilePath,
    settings.periodicNotesTemplateFilePathDaily,
    settings.periodicNotesTemplateFilePathWeekly,
    settings.periodicNotesTemplateFilePathMonthly,
    settings.periodicNotesTemplateFilePathQuarterly,
    settings.periodicNotesTemplateFilePathYearly,
  ]
    .filter(Boolean)
    .map(normalize);
  if (templates.includes(normalize(path))) return;
  for (const [kind, root] of [
    ['project', settings.projectsPath],
    ['area', settings.areasPath],
    ['resource', settings.resourcesPath],
    ['archive', settings.archivesPath],
  ] as const) {
    if (!root || !normalize(path).startsWith(`${normalize(root)}/`)) continue;
    const relative = normalize(path).slice(normalize(root).length + 1);
    const parts = relative.split('/');
    if (parts.length !== 2 || !parts[1].endsWith('.md')) continue;
    const base = parts[1].slice(0, -3);
    if (settings.paraIndexFilename === 'folderName' ? base !== parts[0] : !/(?:^|\.)README$/i.test(base)) continue;
    return { path, name: parts[0], kind };
  }
}

/** Locate actual inline tags, leaving code, links and escaped text untouched. */
export function inlineThemeTags(text: string): { tag: string; start: number; end: number }[] {
  const visible = new Set(markdownLines(text).map((line) => line.index));
  const spans: { tag: string; start: number; end: number }[] = [];
  let offset = 0;
  text.split('\n').forEach((line, index) => {
    if (visible.has(index)) {
      const masked = line.replace(/`+[^`]*`+|!?\[\[[^\]]*\]\]|!?\[[^\]]*\]\([^)]*\)|\\./g, (value) =>
        ' '.repeat(value.length),
      );
      for (const match of masked.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)) {
        spans.push({
          tag: match[1],
          start: offset + match.index! + match[0].length - match[1].length - 1,
          end: offset + match.index! + match[0].length,
        });
      }
    }
    offset += line.length + 1;
  });
  return spans;
}
export function matchedThemes(text: string, themes: CaptureTheme[]): CaptureTheme[] {
  const tags = new Set(inlineThemeTags(text).map((item) => item.tag));
  return themes.filter((theme) => theme.tags.length && theme.tags.every((tag) => tags.has(tag)));
}
export function applyThemeSelection(
  text: string,
  themes: CaptureTheme[],
  original: readonly string[],
  selected: readonly string[],
): string {
  const removed = new Set(themes.filter((theme) => original.includes(theme.path)).flatMap((theme) => theme.tags));
  const wanted = new Set(themes.filter((theme) => selected.includes(theme.path)).flatMap((theme) => theme.tags));
  let next = text;
  for (const span of inlineThemeTags(text).reverse()) {
    if (removed.has(span.tag) && !wanted.has(span.tag)) next = next.slice(0, span.start) + next.slice(span.end);
  }
  const existing = new Set(inlineThemeTags(next).map((span) => span.tag));
  const additions = [...wanted].filter((tag) => !existing.has(tag)).map((tag) => `#${tag}`);
  // Put association tags on their own first line, never inside an unclosed code fence.
  return additions.length ? `${additions.join(' ')}${next.trim() ? `\n${next}` : ''}` : next;
}
