import { renderMissingThemeTags } from '../dependencies/query-help';
import { matchesThemeTag } from '../theme/tag-match';
import { renderThemeQuerySummary } from '../theme/query-summary';
import { themeRowFilter } from '../theme/query-filter';
import { renderTaskQuery } from '../component/TaskQuery';
import type { App, MarkdownPostProcessorContext, Plugin } from 'obsidian';
import type { PluginSettings } from '../type';

import type { DataviewApi, Link, STask } from 'obsidian-dataview';
import { Markdown } from '../component/Markdown';

import type LifeOS from '../main';
import { Date as PeriodicDate } from '../periodic/Date';
import { File } from '../periodic/File';
import { generateIgnoreOperator } from '../util';

type Element = { text: string; link: Link };

export class Bullet {
  app: App;
  date: PeriodicDate;
  file: File;
  plugin: LifeOS;
  settings: PluginSettings;
  locale: string;
  constructor(app: App, settings: PluginSettings, plugin: LifeOS, locale: string) {
    this.app = app;
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
    this.file = new File(this.app, this.settings, this.plugin, locale);
    this.date = new PeriodicDate(this.app, this.settings, this.file, locale);
  }

  listByTime = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filename = ctx.sourcePath;
    const parsed = this.date.parse(filename);
    const condition = this.date.days(parsed);

    if (!condition.from || !condition.to) {
      return;
    }

    const dataview = await this.plugin.getDataviewAPI();

    // 只收集日期范围内的日记文件
    const files = this.date.files(parsed);
    const { days } = files;

    if (!days.length) {
      return;
    }

    const dailyRecordHeader = this.settings.dailyRecordHeader?.trim();
    const lists = dataview
      .pages(`"${days.join('" or "')}"`)
      .file.lists.where((L: { task: boolean; path: string; section: { subpath?: string } }) => {
        if (L.task) return false;
        // 只收集日常记录标题下的 bullet
        if (dailyRecordHeader) return L.section?.subpath?.trim() === dailyRecordHeader;
        return true;
      })
      .sort((L: { path: string; line: number }) => L.path, 'desc');

    const groupResult = lists.groupBy((elem: Element) => {
      return elem.link;
    });
    const sortResult = groupResult.sort((elem: { rows: Element }) => elem.rows.link, 'desc');
    const tableResult = sortResult.map((k: { rows: Element }) => [k.rows.text as string, k.rows.link as Link]);
    const tableValues = tableResult.array();

    const div = el.createEl('div');
    const component = new Markdown(div);

    dataview.table(['Bullet', 'Link'], tableValues, div, component, filename);

    ctx.addChild(component);
  };

  listByTag = async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const filepath = ctx.sourcePath;
    return renderTaskQuery(
      this.app,
      el,
      ctx,
      async (div, component) => {
        const tags = this.file.tags(filepath);
        if (!tags.length) {
          return renderMissingThemeTags(this.app, div, filepath, this.locale);
        }

        const from = tags
          .map((tag: string, index: number) => {
            return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
          })
          .join(' ')
          .trim();
        const dataview = await this.plugin.getDataviewAPI();
        const lists = await dataview.pages(`(${from}) ${generateIgnoreOperator(this.settings)}`).file.lists;
        const allowed = await themeRowFilter(
          this.app,
          this.settings,
          lists.array().map((row: { path: string }) => row.path),
          filepath,
        );
        const result = lists.where((L: { task: STask; path: string; line: number; tags: string[] }) => {
          return !L.task && allowed(L) && matchesThemeTag(L.tags, tags);
        });
        const groupResult = result.groupBy((elem: Element) => {
          return elem.link;
        });
        const sortResult = groupResult.sort((elem: { rows: Element }) => elem.rows.link, 'desc');
        const tableResult = sortResult.map((k: { rows: Element }) => [k.rows.text as string, k.rows.link as Link]);
        const tableValues = tableResult.array();

        renderThemeQuerySummary(div, this.locale, tags, result.length, 'records');
        if (tableValues.length)
          await dataview.table(
            this.locale.startsWith('zh') ? ['记录', '来源'] : ['Record', 'Source'],
            tableValues,
            div,
            component,
            filepath,
          );
      },
      this.locale,
    );
  };
}
