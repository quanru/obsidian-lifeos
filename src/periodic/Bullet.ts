import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { TableResult } from 'obsidian-dataview/lib/api/plugin-api';
import { PluginSettings } from '../type';

import { Markdown } from '../component/Markdown';
import { DataviewApi } from 'obsidian-dataview';

import { File } from '../periodic/File';
import { ERROR_MESSAGES } from '../constant';
import { renderError } from '../util';

export class Bullet {
  app: App;
  file: File;
  dataview: DataviewApi;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings, dataview: DataviewApi) {
    this.app = app;
    this.settings = settings;
    this.dataview = dataview;
    this.file = new File(this.app, this.settings, this.dataview);
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
        ERROR_MESSAGES.NO_FRONT_MATTER_TAG,
        div,
        filepath
      );
    }

    const from = tags
      .map((tag: string[], index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ');
    const where = tags
      .map((tag: string[], index: number) => {
        return `(contains(L.tags, "#${tag}")) ${
          index === tags.length - 1 ? '' : 'OR'
        }`;
      })
      .join(' ');
    const result = (await this.dataview.tryQuery(
      `
TABLE WITHOUT ID rows.L.text AS "Bullet", rows.L.link AS "Link"
FROM (${from}) AND -"${periodicNotesPath}/Templates"
FLATTEN file.lists AS L
WHERE ${where} AND !L.task AND file.path != "${filepath}"
GROUP BY file.link
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
