import {
  type App,
  type MarkdownPostProcessorContext,
  MarkdownRenderer,
} from 'obsidian';
import type { PluginSettings } from '../type';
import { Date } from '../periodic/Date';
import { File } from '../periodic/File';
import { Markdown } from '../component/Markdown';

export class Item {
  dir: string;
  app: App;
  settings: PluginSettings;
  file: File;
  date: Date;

  constructor(dir: string, app: App, settings: PluginSettings, file: File) {
    this.dir = dir;
    this.app = app;
    this.settings = settings;
    this.file = file;
    this.date = new Date(this.app, this.settings, this.file);
  }

  snapshot(dir = this.dir) {
    return this.file.list(dir);
  }

  listByFolder = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const div = el.createEl('div');
    const markdown = this.file.list(this.dir);
    const component = new Markdown(div);

    MarkdownRenderer.render(
      this.app,
      markdown || '- Nothing',
      div,
      ctx.sourcePath,
      component
    );

    ctx.addChild(component);
  };

  listByTag = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filepath = ctx.sourcePath;
    const tags = this.file.tags(filepath);
    const div = el.createEl('div');
    const markdown = this.file.list(this.dir, { tags });
    const component = new Markdown(div);

    MarkdownRenderer.render(
      this.app,
      markdown || '- Nothing',
      div,
      ctx.sourcePath,
      component
    );

    ctx.addChild(component);
  };
}
