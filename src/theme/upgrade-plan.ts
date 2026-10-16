export interface ThemeQueryChange {
  start: number;
  end: number;
  line: number;
  before: string;
  after: string;
}
const queries: Record<string, string> = {
  TaskListByTag: 'TaskOpenListByTag',
  TaskOpenListByTag: 'TaskOpenListByTag',
  BulletListByTag: 'BulletListByTag',
  FileListByTag: 'FileListByTag',
  ThemeListByTag: 'ThemeListByTag',
  ThemeListByFolder: 'ThemeListByFolder',
};

/** Only complete, top-level standard query fences are eligible. Preserve every other byte. */
export function planThemeUpgrade(content: string): ThemeQueryChange[] {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const changes: ThemeQueryChange[] = [];
  let offset = 0;
  let frontmatter = lines[0]?.trim() === '---';
  let fence: { char: string; size: number; line: number; start: number; language: string; opening: string } | undefined;
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index],
      text = raw.replace(/\r?\n$/, '');
    const end = offset + raw.length;
    if (frontmatter) {
      if (index > 0 && /^(---|\.\.\.)\s*$/.test(text)) frontmatter = false;
      offset = end;
      continue;
    }
    const match = text.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)$/);
    if (fence) {
      if (match && match[1][0] === fence.char && match[1].length >= fence.size && !match[2].trim()) {
        const body = lines.slice(fence.line + 1, index).join('');
        const query = body.trim();
        if (
          ['LifeOS', 'PeriodicPARA', 'LifeOSOpen'].includes(fence.language) &&
          Object.prototype.hasOwnProperty.call(queries, query)
        ) {
          const before = content.slice(fence.start, end);
          const after = fence.opening.replace(fence.language, 'LifeOSOpen') + body.replace(query, queries[query]) + raw;
          if (before !== after) changes.push({ start: fence.start, end, line: fence.line + 1, before, after });
        }
        fence = undefined;
      }
    } else if (match) {
      fence = {
        char: match[1][0],
        size: match[1].length,
        line: index,
        start: offset,
        language: match[2].trim(),
        opening: raw,
      };
    }
    offset = end;
  }
  return changes;
}

export function applyThemeUpgrade(content: string, changes: ThemeQueryChange[]): string {
  let result = content;
  for (const change of [...changes].sort((a, b) => b.start - a.start)) {
    if (result.slice(change.start, change.end) !== change.before) throw new Error('stale-theme-upgrade');
    result = result.slice(0, change.start) + change.after + result.slice(change.end);
  }
  return result;
}
