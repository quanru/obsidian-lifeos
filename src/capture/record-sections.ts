import { markdownLines } from '../markdown-lines';

/** Identify records by their nearest real heading, rather than a parent section's extent. */
export function captureRecordLines(content: string, recordHeader: string, habitHeader = ''): Set<number> {
  const cleanHeading = (value: string) =>
    value
      .trim()
      .replace(/^#{1,6}\s*/, '')
      .replace(/\s+#+$/, '')
      .trim();
  const recordTitles = new Set(
    [
      cleanHeading(recordHeader || 'Daily Record')
        .replaceAll('.', '')
        .replace(/\s+/g, ' '),
      'Daily Record',
      '日常记录',
      '日常記錄',
    ].map((value) => cleanHeading(value).toLocaleLowerCase()),
  );
  const habitTitle = cleanHeading(habitHeader).replaceAll('.', '').replace(/\s+/g, ' ');
  const eligible = new Set<number>();
  let inRecords = false;
  let listIndent: number | undefined;
  for (const { text, index } of markdownLines(content)) {
    if (text.trim()) {
      const indent = text.match(/^ */)![0].length;
      // A heading indented inside a list is part of that record's Markdown body.
      if (listIndent === undefined || indent <= listIndent) {
        const heading = text.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
        if (heading) {
          const title = cleanHeading(heading[1]);
          const isHabit = Boolean(habitTitle) && title.replaceAll('.', '').replace(/\s+/g, ' ') === habitTitle;
          inRecords = !isHabit && recordTitles.has(title.toLocaleLowerCase());
        }
        listIndent = /^ {0,3}(?:[-*+] |\d+[.)] )/.test(text) ? indent : undefined;
      }
    }
    if (inRecords) eligible.add(index);
  }
  return eligible;
}
