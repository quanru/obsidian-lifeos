import { readCaptureRecords } from '../capture/history';
import { markdownLines } from '../markdown-lines';
import type { ReviewI18n } from './i18n';

export type ReviewEntry = { path: string; text: string };
export type ReviewData = {
  from: string;
  to: string;
  records: ReviewEntry[];
  done: ReviewEntry[];
  open: ReviewEntry[];
  projects: ReviewEntry[];
};
export const REVIEW_START = '<!-- lifeos:weekly-review:start -->';
export const REVIEW_END = '<!-- lifeos:weekly-review:end -->';

export function collectDailyEntries(
  path: string,
  content: string,
  recordHeader: string,
) {
  const entries: Pick<ReviewData, 'records' | 'done' | 'open'> = {
    records: [],
    done: [],
    open: [],
  };
  entries.records = readCaptureRecords(content, path, '', recordHeader)
    .filter((record) => record.kind === 'record' && record.text.trim())
    .map((record) => ({
      path,
      text: `${record.time ? `${record.time} ` : ''}${record.text}`,
    }));
  for (const { text } of markdownLines(content)) {
    const task = text.match(/^\s*[-*+] \[([ xX])\]\s+(.+)$/);
    if (task?.[2].trim()) {
      entries[task[1] === ' ' ? 'open' : 'done'].push({
        path,
        text: task[2].trim().replace(/\s+\^capture-[a-z0-9-]+$/i, ''),
      });
    }
  }
  return entries;
}

function sourceLink(entry: ReviewEntry, linkOnly = false) {
  const path = entry.path.replace(/\.md$/, '');
  const label = linkOnly ? entry.text : path.split('/').pop() || path;
  // Escape wiki delimiters so filenames and user content cannot create managed markers.
  const safePath = path.replace(
    /[\[\]|#\n\r]/g,
    (char) => `&#${char.charCodeAt(0)};`,
  );
  const safeLabel = label.replace(/[\[\]|\n\r]/g, ' ');
  const text = entry.text.replace(/<!--/g, '&lt;!--').replace(/\r?\n/g, ' ');
  const link = `[[${safePath}|${safeLabel}]]`;
  return linkOnly ? link : `${text} — ${link}`;
}

export function renderReview(
  data: ReviewData,
  t: ReviewI18n,
  preview = false,
): string {
  const sections: [string, ReviewEntry[], string][] = [
    [t.records, data.records, ''],
    [t.done, data.done, '✓ '],
    [t.open, data.open, '○ '],
    [t.projects, data.projects, ''],
  ];
  return [
    ...(preview
      ? [`${data.from} → ${data.to}`, '']
      : [
          `# ${t.title}`,
          '',
          `${data.from} → ${data.to}`,
          '',
          t.description,
          '',
        ]),
    ...sections.flatMap(([title, entries, prefix]) => [
      `## ${title} (${entries.length})`,
      '',
      entries.length
        ? entries
            .map(
              (entry) =>
                `- ${prefix}${sourceLink(entry, title === t.projects)}`,
            )
            .join('\n')
        : t.empty,
      '',
    ]),
  ].join('\n');
}

export function updateReview(
  content: string | undefined,
  generated: string,
  t: ReviewI18n,
): string {
  const block = `${REVIEW_START}\n${generated.trimEnd()}\n${REVIEW_END}`;
  if (content === undefined)
    return `${block}\n\n## ${t.reflection}\n\n${t.prompts}\n`;
  const start = content.indexOf(REVIEW_START);
  const end = content.indexOf(REVIEW_END);
  if (
    start < 0 ||
    end < start ||
    content.indexOf(REVIEW_START, start + REVIEW_START.length) >= 0 ||
    content.indexOf(REVIEW_END, end + REVIEW_END.length) >= 0
  ) {
    throw new Error(t.collision);
  }
  return (
    content.slice(0, start) + block + content.slice(end + REVIEW_END.length)
  );
}
