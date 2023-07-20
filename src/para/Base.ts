import { type App, type MarkdownPostProcessorContext, Component, MarkdownRenderer } from 'obsidian';
import type { PluginSettings } from '../type';
import { Date } from '../periodic/Date';
import { File } from '../periodic/File';

export abstract class Base {
  dir: string;
  app: App;
  settings: PluginSettings;
  file: File;
  date: Date;

  constructor(dir: string, app: App, settings: PluginSettings) {
    this.dir = dir;
    this.app = app;
    this.settings = settings;
    this.date = new Date(this.app, this.settings);
    this.file = new File(this.app, this.settings);
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
    const component = new Component();

    component.load();

    return MarkdownRenderer.renderMarkdown(
      markdown,
      div,
      ctx.sourcePath,
      component
    );
  };
}
