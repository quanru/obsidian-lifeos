import { Task } from '../periodic/Task';
import { Date } from '../periodic/Date';
import { Component, MarkdownPostProcessorContext } from 'obsidian';
import { STask } from 'obsidian-dataview';

export default function (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const task = new Task(this.app);
  const date = new Date(this.app);
  const filename = this.app?.workspace?.getActiveFile()?.basename;
  const parsed = date.parse(filename);
  const condition = date.days(parsed);
  this.dataviewAPI?.taskList(
    this.dataviewAPI
      .pages('')
      ?.file?.tasks.where((t: STask) =>
        task.filter(t, {
          date: 'DONE',
          ...condition,
        })
      )
      .sort((t: STask) => t.completion, 'asc'),
    false,
    el,
    new Component()
  );
}
