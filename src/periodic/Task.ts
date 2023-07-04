import { moment, Component } from 'obsidian';
import type { App, MarkdownPostProcessorContext } from 'obsidian';
import { DataviewApi, STask } from 'obsidian-dataview';

import { Date } from 'src/periodic/Date';
import { TaskStatusType, TaskConditionType, PluginSettings } from 'src/type';

export class Task {
  app: App;
  date: Date;
  dataview: DataviewApi;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings, dataview: DataviewApi) {
    this.app = app;
    this.settings = settings;
    this.dataview = dataview;
    this.date = new Date(this.app, this.settings);
  }

  doneList = (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filename = this.app.workspace.getActiveFile()?.basename;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);
    const tasks = this.dataview
      .pages('')
      .file.tasks.where((t: STask) =>
        this.filter(t, {
          date: TaskStatusType.DONE,
          ...condition,
        })
      )
      .sort((t: STask) => t.completion, 'asc');
    const c = new Component();

    c.load();
    this.dataview.taskList(tasks, false, el, c);
  };

  recordList = (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filename = this.app.workspace.getActiveFile()?.basename;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);
    const tasks = this.dataview.pages('').file.tasks.where((t: STask) =>
      this.filter(t, {
        date: TaskStatusType.RECORD,
        ...condition,
      })
    );
    // 收集日期范围内的日记文件
    const c = new Component();

    c.load();
    this.dataview.taskList(tasks, false, el, c);

    // 收集日期范围内的非日记文件
    const files = this.date.files(parsed);
    const pages = Object.values(files).flat();

    if (pages.length) {
      const tasks = this.dataview
        .pages(`"${pages.join('" or "')}"`)
        .file.tasks.where((task: STask) => task);
      const c = new Component();

      c.load();
      this.dataview.taskList(tasks, false, el, c);
    }
  };

  filter(
    task: STask,
    condition: TaskConditionType = {
      date: TaskStatusType.DONE,
    }
  ): boolean {
    const { date = TaskStatusType.DONE, from, to } = condition;

    if (!task) return false;

    if (!from && !to) return false;

    if (task?.section?.subpath?.includes('习惯打卡')) return false;

    let dateText = '';

    if (date === TaskStatusType.DONE) {
      // filter by done date
      const ret = task?.text.match(/✅ (\d\d\d\d-\d\d-\d\d)/);

      if (!ret) return false;
      dateText = ret[1];
    } else if (date === TaskStatusType.RECORD) {
      // filter by record date
      const ret = task?.path.match(/\d\d\d\d-\d\d-\d\d/);

      if (!ret) return false;

      dateText = ret[0];
    }

    const targetDate = moment(dateText);

    if (!targetDate) return false;

    const isFromFullfil = from ? targetDate.isSameOrAfter(moment(from)) : true;
    const isToFullfil = to ? targetDate.isSameOrBefore(moment(to)) : true;

    const isFullfil =
      task.children
        .map((subtask: STask) => this.filter(subtask, condition))
        .includes(true) ||
      (task.text.length > 1 &&
        ((date === TaskStatusType.DONE && task.completed) ||
          date === TaskStatusType.RECORD) &&
        isFromFullfil &&
        isToFullfil);

    return isFullfil;
  }
}
