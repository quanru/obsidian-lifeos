import { Task } from '../periodic/Task';
import { Date } from '../periodic/Date';
import { Component, MarkdownPostProcessorContext } from 'obsidian';
import { STask } from 'obsidian-dataview';

export default function (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const task = new Task(this.app);
  const date = new Date(this.app);
  const filename = this.app?.workspace?.getActiveFile()?.basename;
  const parsed = date.parse(filename);
  const condition = date.days(parsed);
  // 收集日期范围内的日记文件
  this.dataviewAPI?.taskList(
    this.dataviewAPI?.pages('')?.file?.tasks.where((t: STask) =>
      task.filter(t, {
        date: 'RECORD',
        ...condition,
      })
    ),
    false,
    el,
    new Component()
  );

  // 收集日期范围内的非日记文件
  const files = date.files(parsed);
  const pages = Object.values(files).flat();

  if (pages.length) {
    this.dataviewAPI?.taskList(
      this.dataviewAPI.pages(`"${pages.join('" or "')}"`)
        ?.file?.tasks.where((task: STask) => task),
      false,
      el,
      new Component()
    );
  }
}