import { headingSection } from '../markdown-lines';

export type QuickCaptureKind = 'record' | 'task';

export function formatCaptureEntry(kind: QuickCaptureKind, text: string, time: string): string {
  const [firstLine = '', ...remainingLines] = text.replace(/\r\n/g, '\n').trim().split('\n');
  if (kind === 'record' && /^(?:[-*+] |\d+[.)] |#{1,6} |>|```|~~~)/.test(firstLine)) {
    return `- ${time}\n${[firstLine, ...remainingLines].map((line) => `  ${line}`).join('\n')}`;
  }
  const prefix = kind === 'task' ? '- [ ] ' : `- ${time} `;
  const continuation = remainingLines.map((line) => `  ${line}`).join('\n');

  return continuation ? `${prefix}${firstLine}\n${continuation}` : `${prefix}${firstLine}`;
}

function normalizeHeadingTitle(header: string): string {
  return header
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/\s+#+$/, '')
    .trim();
}

export function appendUnderHeading(content: string, header: string, entry: string): string {
  const headingTitle = normalizeHeadingTitle(header);
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const section = headingSection(content, header, false);
  if (!section) {
    const base = content.trimEnd();
    const sectionContent = `## ${headingTitle}\n\n${entry}`;
    return `${base ? `${base}\n\n` : ''}${sectionContent}\n`;
  }
  const headingIndex = section.start;
  const sectionEnd = section.end;

  const before = lines.slice(0, sectionEnd);
  while (before.length > headingIndex + 1 && before[before.length - 1].trim() === '') {
    before.pop();
  }

  if (before.length === headingIndex + 1) before.push('');
  before.push(...entry.split('\n'));

  const after = lines.slice(sectionEnd);
  if (after.length) before.push('');

  return `${[...before, ...after].join('\n').trimEnd()}\n`;
}
