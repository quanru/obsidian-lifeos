import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { PluginSettings } from '../type';

import type { DataviewApi, Link, STask } from 'obsidian-dataview';
import { Markdown } from '../component/Markdown';

import { ERROR_MESSAGE } from '../constant';
import { getI18n } from '../i18n';
import { File } from '../periodic/File';
import { generateIgnoreOperator, renderError } from '../util';

type Element = { text: string; link: Link };

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
    locale: string,
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
    ctx: MarkdownPostProcessorContext,
  ) => {
    const filepath = ctx.sourcePath;
    const tags = this.file.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);

    if (!tags.length) {
      return renderError(
        this.app,
        getI18n(this.locale)[`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`],
        div,
        filepath,
      );
    }

    const from = tags
      .map((tag: string[], index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();
    const lists = await this.dataview.pages(
      `(${from}) ${generateIgnoreOperator(this.settings)}`,
    ).file.lists;
    const result = lists.where(
      (L: { task: STask; path: string; tags: string[] }) => {
        let includeTag = false;
        if (L.task || L.path === filepath) return false;
        for (const tag of tags) {
          includeTag = L.tags.join(' ').includes(`#${tag}`);
          if (includeTag) {
            break;
          }
        }
        return includeTag;
      },
    );
    const groupResult = result.groupBy((elem: Element) => {
      return elem.link;
    });
    const sortResult = groupResult.sort(
      (elem: { rows: Element }) => elem.rows.link,
      'desc',
    );
    const tableResult = sortResult.map((k: { rows: Element }) => [
      k.rows.text as string,
      k.rows.link as Link,
    ]);
    const tableValues = tableResult.array();

    this.dataview.table(
      ['Bullet', 'Link'],
      tableValues,
      div,
      component,
      filepath,
    );

    ctx.addChild(component);
  };
}
