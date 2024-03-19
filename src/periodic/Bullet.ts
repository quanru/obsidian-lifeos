import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { TableResult } from 'obsidian-dataview/lib/api/plugin-api';
import { PluginSettings } from '../type';

import { Markdown } from '../component/Markdown';
import { DataviewApi } from 'obsidian-dataview';

import { File } from '../periodic/File';
import { ERROR_MESSAGE } from '../constant';
import { renderError } from '../util';
import { I18N_MAP } from '../i18n';

export class Bullet {
  app: App;
  file: File;
  dataview: DataviewApi;
  settings: PluginSettings;
  locale: string;
  constructor(
    app: App,
    settings: PluginSettings,
    dataview: DataviewApi,
    locale: string
  ) {
    this.app = app;
    this.settings = settings;
    this.dataview = dataview;
    this.locale = locale;
    this.file = new File(this.app, this.settings, this.dataview, locale);
  }

  listByTag = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filepath = ctx.sourcePath;
    const tags = this.file.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);
    const periodicNotesPath = this.settings.periodicNotesPath;

    if (!tags.length) {
      return renderError(
        this.app,
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`],
        div,
        filepath
      );
    }

    const from = tags
      .map((tag: string[], index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();
    const where = tags
      .map((tag: string[], index: number) => {
        return `(contains(L.tags, "#${tag}")) ${index === tags.length - 1 ? '' : 'OR'
          }`;
      })
      .join(' ');
      // 优化尝试
    //     const result = (await this.dataview.tryQuery(
    //       `
    // TABLE WITHOUT ID rows.L.text AS "Bullet", rows.L.link AS "Link"
    // FROM (${from} AND ("${this.file.settings.periodicNotesPath}" OR "Dida/笔记.md")) AND -"${periodicNotesPath}/Templates"
    // FLATTEN file.lists AS L
    // WHERE ${where} AND !L.task AND file.path != "${filepath}"
    // GROUP BY L.link
    // SORT rows.file.link DESC
    //     `
    //     )) as TableResult;
    const result = (await this.dataview.tryQuery(
      `
TABLE WITHOUT ID rows.L.text AS "Bullet", rows.L.link AS "Link"
FROM (${from}) AND -"${periodicNotesPath}/Templates"
FLATTEN file.lists AS L
WHERE ${where} AND !L.task AND file.path != "${filepath}"
GROUP BY L.link
SORT rows.file.link DESC
    `
    )) as TableResult;

    this.dataview.table(
      result.headers,
      result.values,
      div,
      component,
      filepath
    );

    ctx.addChild(component);
  };
}
