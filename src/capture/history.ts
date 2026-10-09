import { markdownLines } from '../markdown-lines';
import { captureRecordLines } from './record-sections';
import { type QuickCaptureKind, formatCaptureEntry } from './content';

export interface CaptureRecord {
  path: string;
  date: string;
  line: number;
  end: number;
  raw: string;
  text: string;
  time: string;
  kind: QuickCaptureKind;
  checked: boolean;
  tags: string[];
  blockId?: string;
  blockIdFirst?: boolean;
  ambiguous?: boolean;
}

export function recordTags(text: string): string[] {
  // Inline code, code fences and URLs are not tag sources.
  const plain = text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`]*`/g, '');
  return [...new Set(Array.from(plain.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu), (m) => m[1]))];
}

export function readCaptureRecords(
  content: string,
  path: string,
  date: string,
  header: string,
  habitHeader = '',
): CaptureRecord[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const visible = captureRecordLines(content, header, habitHeader);
  const result: CaptureRecord[] = [];
  for (let line = 0; line < lines.length; line++) {
    if (!visible.has(line)) continue;
    if (/^[-*+] \[[ xX]\]\s*$/.test(lines[line])) continue;
    const first = lines[line].match(/^[-*+] (?:\[([ xX])\] )?(.*)$/);
    if (!first) continue;
    let end = line + 1;
    while (end < lines.length && (/^\s*$/.test(lines[end]) || /^(?: {2}|\t)/.test(lines[end]))) end++;
    while (end > line + 1 && !lines[end - 1].trim()) end--;
    const raw = lines.slice(line, end).join('\n');
    const firstId = first[2].match(/\s+(\^[\p{L}\p{N}_-]+)$/u)?.[1];
    const lastId = !firstId && end > line + 1 ? lines[end - 1].match(/\s+(\^[\p{L}\p{N}_-]+)$/u)?.[1] : undefined;
    const blockId = firstId || lastId;
    const time = first[1] === undefined ? (first[2].match(/^(\d{2}:\d{2})(?: |$)/)?.[1] ?? '') : '';
    const text = [
      first[2].slice(time ? time.length + 1 : 0).replace(firstId ? /\s+\^[\p{L}\p{N}_-]+$/u : /$^/, ''),
      ...lines.slice(line + 1, end).map((l) => l.replace(/^ {2}|^\t/, '')),
    ]
      .join('\n')
      .replace(/^\n/, '')
      .replace(lastId ? /\s+\^[\p{L}\p{N}_-]+$/u : /$^/, '');
    result.push({
      path,
      date,
      line,
      end,
      raw,
      text,
      time,
      kind: first[1] === undefined ? 'record' : 'task',
      checked: !!first[1]?.trim(),
      tags: recordTags(text),
      blockId: blockId || undefined,
      blockIdFirst: !!firstId,
    });
    line = end - 1;
  }
  const counts = new Map<string, number>();
  result.forEach((record) => counts.set(record.raw, (counts.get(record.raw) ?? 0) + 1));
  result.forEach((record) => {
    record.ambiguous = counts.get(record.raw)! > 1;
  });
  return result;
}

export class CaptureConflict extends Error {
  constructor() {
    super('The source record changed. Refresh and try again.');
  }
}

/** Match the whole source block inside its original section. Never replace changed or ambiguous content. */
export function replaceCaptureRecord(
  content: string,
  record: CaptureRecord,
  header: string,
  replacement: string | null,
  habitHeader = '',
): string {
  if (record.ambiguous) throw new CaptureConflict();
  const candidates = readCaptureRecords(content, record.path, record.date, header, habitHeader).filter(
    (r) => r.raw === record.raw,
  );
  if (candidates.length !== 1) throw new CaptureConflict();
  const match = candidates[0];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  lines.splice(match.line, match.end - match.line, ...(replacement === null ? [] : replacement.split('\n')));
  const next = lines.join('\n');
  return content.includes('\r\n') ? next.replace(/\n/g, '\r\n') : next;
}

export function revisedRecord(record: CaptureRecord, text: string, kind = record.kind): string {
  let entry = formatCaptureEntry(kind, text, record.time || '00:00');
  if (kind === 'record' && !record.time) entry = entry.replace(/^- 00:00(?: |(?=\n|$))/, '- ');
  if (kind === 'task' && record.checked && record.kind === 'task') entry = entry.replace(/^- \[ \]/, '- [x]');
  if (record.blockId) {
    const lines = entry.split('\n');
    const index = record.blockIdFirst ? 0 : lines.length - 1;
    lines[index] += ` ${record.blockId}`;
    entry = lines.join('\n');
  }
  return entry;
}

export function toggleRecordTask(record: CaptureRecord, index: number, checked: boolean): string {
  const lines = record.raw.split('\n');
  const visible = new Set(markdownLines(record.raw).map((line) => line.index));
  const positions = lines.flatMap((line, i) => (visible.has(i) && /^\s*[-*+] \[[ xX]\] /.test(line) ? [i] : []));
  const line = positions[index];
  if (line === undefined) throw new CaptureConflict();
  lines[line] = lines[line].replace(/\[[ xX]\]/, checked ? '[x]' : '[ ]');
  return lines.join('\n');
}

export interface CaptureFilter {
  keyword: string;
  tags: string[];
  from: string;
  to: string;
}
export function filterRecords(records: CaptureRecord[], filters: CaptureFilter) {
  const keyword = filters.keyword.trim().toLocaleLowerCase();
  return records.filter(
    (r) =>
      (!keyword || r.text.toLocaleLowerCase().includes(keyword)) &&
      filters.tags.every((tag) => r.tags.includes(tag)) &&
      (!filters.from || r.date >= filters.from) &&
      (!filters.to || r.date <= filters.to),
  );
}
