import { headingSection } from '../markdown-lines';

export function recordCursor(content: string, header: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const section = headingSection(content, header, false);
  let line = section ? Math.max(section.start, section.end - 1) : lines.length - 1;
  while (section && line > section.start + 1 && !lines[line].trim()) line--;
  return { line, ch: lines[line].length };
}
