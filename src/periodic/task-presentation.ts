import type { SListItem } from 'obsidian-dataview/lib/data-model/serialized/markdown';
import { markdownLines } from '../markdown-lines';

/** Hide generated capture references in the view while keeping source text for Dataview writeback. */
export function captureTaskText(text: string): string {
  const visible = new Set(markdownLines(text).map((line) => line.index));
  return text
    .split('\n')
    .map((line, index) =>
      visible.has(index)
        ? line.replace(/[ \t]+\^capture-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?=[ \t]*\r?$)/gi, '')
        : line,
    )
    .join('\n');
}

export function presentCaptureTask<T extends SListItem>(task: T): T {
  return {
    ...task,
    visual: captureTaskText(task.visual ?? task.text),
    children: task.children.map(presentCaptureTask),
  };
}
