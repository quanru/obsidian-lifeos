import type { App, MarkdownPostProcessorContext } from 'obsidian';
import { PluginSettings } from '../type';

import { Component, MarkdownRenderer } from 'obsidian';
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
    this.file = new File(this.app, this.settings);
  }

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

    const from = tags
      .map((tag: string[], index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ');
    const where = tags
      .map((tag: string[], index: number) => {
        return `(contains(L.tags, "${tag}")) ${
          index === tags.length - 1 ? '' : 'OR'
        }`;
      })
      .join(' ');
    const markdown = await this.dataview.tryQueryMarkdown(
      `
TABLE WITHOUT ID rows.L.text AS "Text", rows.file.link AS "File"
FROM (${from}) AND -"Templates"
FLATTEN file.lists AS L
WHERE ${where} AND !L.task AND file.path != "${filepath}"
GROUP BY file.link
SORT rows.file.link DESC
    `
    );
    const formattedMarkdown = markdown
      .replaceAll('\\\\', '\\')
      .replaceAll('\n<', '<');

    component.load();
    return MarkdownRenderer.renderMarkdown(
      formattedMarkdown,
      el.createEl('div'),
      ctx.sourcePath,
      component
    );
  };
}
