import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { PluginSettings } from '../type';

import type { DataArray, DataviewApi, Link } from 'obsidian-dataview';
import { Markdown } from '../component/Markdown';

import type { SListItem } from 'obsidian-dataview/lib/data-model/serialized/markdown';
import { ERROR_MESSAGE } from '../constant';
import { I18N_MAP } from '../i18n';
import { File } from '../periodic/File';
import { generateIgnoreOperator, renderError } from '../util';

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
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`],
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
    const lists: DataArray<SListItem> = await this.dataview.pages(
      `(${from}) ${generateIgnoreOperator(this.settings)}`,
    ).file.lists;
    const result = lists.where(L => {
      let includeTag = false;
      if (L.task || L.path === filepath) return false;
      for (const tag of tags) {
        includeTag = L.tags.join(' ').includes(`#${tag}`);
        if (includeTag) {
          break;
        }
      }
      return includeTag;
    });
    const groupResult = result.groupBy(elem => {
      return elem.link;
    });
    const sortResult = groupResult.sort(elem => elem.rows.link as Link, 'desc');
    const tableResult = sortResult.map(k => [
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
