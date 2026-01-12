import type { App, MarkdownPostProcessorContext, Plugin } from 'obsidian';
import type { TaskResult } from 'obsidian-dataview/lib/api/plugin-api';
import type { PluginSettings, TaskConditionType } from '../type';

import { moment } from 'obsidian';
import type { DataviewApi, STask } from 'obsidian-dataview';
import { ERROR_MESSAGE } from '../constant';
import { TaskStatusType } from '../type';

import { Markdown } from '../component/Markdown';
import { getI18n } from '../i18n';
import type LifeOS from '../main';
import { Date as PeriodicDate } from '../periodic/Date';
import { File } from '../periodic/File';
import { generateIgnoreOperator, renderError } from '../util';

export class Task {
  app: App;
  date: PeriodicDate;
  plugin: LifeOS;
  settings: PluginSettings;
  locale: string;
  file: File;
  constructor(app: App, settings: PluginSettings, plugin: LifeOS, locale: string) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
    this.file = new File(this.app, this.settings, this.plugin, locale);
    this.date = new PeriodicDate(this.app, this.settings, this.file, locale);
  }

  doneListByTime = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filename = ctx.sourcePath;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);

    if (condition.from === null && condition.to === null) {
      return;
    }

    const dataview = await this.plugin.getDataviewAPI();
    const tasks = dataview
      .pages('')
      .file.tasks.where((t: STask) =>
        this.filter(t, {
          status: TaskStatusType.DONE,
          ...condition,
        }),
      )
      .sort((t: STask) => t.completion, 'asc');

    const div = el.createEl('div');
    const component = new Markdown(div);

    dataview.taskList(tasks, false, div, component);

    ctx.addChild(component);
  };

  recordListByTime = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filename = ctx.sourcePath;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);

    if (condition.from === null && condition.to === null) {
      return;
    }

    const dataview = await this.plugin.getDataviewAPI();
    let tasks = [];
    // 收集日期范围内的日记文件
    const dailyTasks = dataview.pages('').file.tasks.where((t: STask) =>
      this.filter(t, {
        status: TaskStatusType.RECORD,
        ...condition,
      }),
    );

    tasks = [...dailyTasks];

    // 收集日期范围内的非日记文件（周记、月记、季记、年记）
    const files = this.date.files(parsed);
    const { weeks, months, quarters } = files;
    const pages = [...weeks, ...months, ...quarters];

    if (pages.length) {
      const nonDailyTasks = dataview.pages(`"${pages.join('" or "')}"`).file.tasks;

      tasks = [...dailyTasks, ...nonDailyTasks];
    }

    const div = el.createEl('div');
    const component = new Markdown(div);

    dataview.taskList(tasks, false, div, component);

    ctx.addChild(component);
  };

  listByTag = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filepath = ctx.sourcePath;
    const tags = this.file.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);

    if (!tags.length) {
      return renderError(this.app, getI18n(this.locale)[`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`], div, filepath);
    }

    const from = tags
      .map((tag: string, index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();
    const where = tags
      .map((tag: string, index: number) => {
        return `contains(lower(tags), "#${tag.toLowerCase()}") ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ');

    const dataview = await this.plugin.getDataviewAPI();
    const { values: tasks } = (await dataview.tryQuery(`
TASK
FROM (${from}) ${generateIgnoreOperator(this.settings)}
WHERE ${where} AND file.path != "${filepath}"
SORT status ASC
    `)) as TaskResult;

    dataview.taskList(tasks, false, div, component);

    ctx.addChild(component);
  };

  filter(
    task: STask,
    condition: TaskConditionType = {
      status: TaskStatusType.DONE,
    },
  ): boolean {
    const { status: date = TaskStatusType.DONE, from, to } = condition;

    if (!task) return false;

    if (!from && !to) return false;

    if (task?.section?.type === 'header' && task?.section?.subpath?.trim() === this.settings.habitHeader.trim()) {
      return false;
    }

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
      task.children.map((subtask: STask) => this.filter(subtask, condition)).includes(true) ||
      (task.text.length > 1 &&
        ((date === TaskStatusType.DONE && task.completed) || date === TaskStatusType.RECORD) &&
        isFromFullfil &&
        isToFullfil);

    return isFullfil;
  }
}
