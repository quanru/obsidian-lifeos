import { markdownLines } from '../markdown-lines';

/** Standalone tag lines are presented as metadata; tags within prose remain in place. */
export function captureBody(text: string): string {
  const tagLines = new Set(
    markdownLines(text)
      .filter(({ text }) => /^(?:#[\p{L}\p{N}_/-]+(?:[ \t]+|$))+$/u.test(text))
      .map(({ index }) => index),
  );
  return text
    .split('\n')
    .filter((_, index) => !tagLines.has(index))
    .join('\n')
    .trim();
}
