/** Yield Markdown lines outside frontmatter and fenced code blocks. Keep original offsets. */
export function markdownLines(
  content: string,
): { text: string; index: number }[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let frontmatter = lines[0]?.trim() === '---';
  let fence: { char: string; length: number } | undefined;
  const result: { text: string; index: number }[] = [];
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index];
    if (frontmatter) {
      if (index > 0 && /^(---|\.\.\.)\s*$/.test(text)) frontmatter = false;
      continue;
    }
    const match = text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (
        match &&
        match[1][0] === fence.char &&
        match[1].length >= fence.length &&
        !match[2].trim()
      )
        fence = undefined;
      continue;
    }
    if (match) {
      fence = { char: match[1][0], length: match[1].length };
      continue;
    }
    result.push({ text, index });
  }
  return result;
}

export function headingSection(content: string, title: string) {
  const normalized = title
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/\s+#+$/, '')
    .trim();
  // An indented heading inside a list item belongs to that item, not the daily section.
  let listIndent: number | undefined;
  const visible = markdownLines(content).filter(({ text }) => {
    if (!text.trim()) return true;
    const indent = text.match(/^ */)![0].length;
    if (listIndent !== undefined && indent > listIndent) return false;
    listIndent = /^ {0,3}(?:[-*+] |\d+[.)] )/.test(text) ? indent : undefined;
    return true;
  });
  const start = visible.findIndex(
    ({ text }) =>
      text.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/)?.[1]?.trim() === normalized,
  );
  if (start < 0) return undefined;
  const level = visible[start].text.trimStart().match(/^#+/)![0].length;
  const end = visible.slice(start + 1).find(({ text }) => {
    const heading = text.match(/^ {0,3}(#{1,6})\s+/);
    return heading && heading[1].length <= level;
  });
  return {
    start: visible[start].index,
    end: end?.index ?? content.replace(/\r\n/g, '\n').split('\n').length,
  };
}
