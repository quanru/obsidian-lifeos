import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { TaskConditionType, PluginSettings } from '../type';
import type { TaskResult } from 'obsidian-dataview/lib/api/plugin-api';

import { TaskStatusType } from '../type';
import { moment, Component } from 'obsidian';
import { DataviewApi, STask } from 'obsidian-dataview';
import { ERROR_MESSAGES } from '../constant';

import { Date } from '../periodic/Date';
import { renderError } from '../util';

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

  doneListByTime = (
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
    const component = new Component();

    component.load();
    this.dataview.taskList(tasks, false, el, component);
  };

  recordListByTime = (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filename = this.app.workspace.getActiveFile()?.basename;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);
    let tasks = [];
    // 收集日期范围内的日记文件
    const dailyTasks = this.dataview.pages('').file.tasks.where((t: STask) =>
      this.filter(t, {
        date: TaskStatusType.RECORD,
        ...condition,
      })
    );
    
    tasks= [...dailyTasks];

    // 收集日期范围内的非日记文件
    const files = this.date.files(parsed);
    const pages = Object.values(files).flat();

    if (pages.length) {
      const nonDailyTasks = this.dataview
        .pages(`"${pages.join('" or "')}"`)
        .file.tasks.where((task: STask) => task);

      tasks = [...dailyTasks, ...nonDailyTasks];
    }

    const component = new Component();

    component.load();
    this.dataview.taskList(tasks, false, el, component);
  };

  listByTag = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filepath = ctx.sourcePath;
    const {
      frontmatter: { tags },
    } = this.dataview.page(filepath)?.file || { frontmatter: {} };
    const component = new Component();
    const containerEl = el.createEl('div');

    if (!tags) {
      return renderError(
        ERROR_MESSAGES.NO_FRONT_MATTER_TAG,
        containerEl,
        ctx.sourcePath
      );
    }

    const where = tags
      .map((tag: string[], index: number) => {
        return `contains(tags, "#${tag}") ${
          index === tags.length - 1 ? '' : 'OR'
        }`;
      })
      .join(' ');

    const { values: tasks } = await this.dataview.tryQuery(`
TASK
FROM -"Templates"
WHERE ${where} AND file.path != "${filepath}"
SORT completed ASC
    `) as TaskResult;

    component.load();

    return this.dataview.taskList(tasks, false, el, component);
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
