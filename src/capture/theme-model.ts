import { normalizeThemePath, themeRoots, themeTemplatePaths, isThemeIndex, themeIndexStyle } from '../theme/config';
import { markdownLines } from '../markdown-lines';
import type { PluginSettings } from '../type';

export type ThemeKind = 'theme' | 'project' | 'area' | 'resource' | 'archive';
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
  if (settings.useThemeNotes === false) return;
  const normalized = normalizeThemePath(path);
  if (themeTemplatePaths(settings).includes(normalized)) return;
  const roots = themeRoots(settings).sort((a, b) => b.root.length - a.root.length);
  for (const { kind, root } of roots) {
    if (!normalized.startsWith(`${root}/`)) continue;
    const parts = normalized.slice(root.length + 1).split('/');
    if (parts.length < 2 || !isThemeIndex(parts[parts.length - 1], parts[parts.length - 2], themeIndexStyle(settings)))
      continue;
    return { path, name: parts[parts.length - 2], kind };
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
  return themes.filter((theme) => theme.tags.length && theme.tags.some((tag) => tags.has(tag)));
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
  const additions = themes
    .filter((theme) => selected.includes(theme.path) && !theme.tags.some((tag) => existing.has(tag)))
    .map((theme) => theme.tags[0])
    .filter((tag, index, tags) => tag && tags.indexOf(tag) === index)
    .map((tag) => `#${tag}`);
  // Put association tags on their own first line, never inside an unclosed code fence.
  return additions.length ? `${additions.join(' ')}${next.trim() ? `\n${next}` : ''}` : next;
}
