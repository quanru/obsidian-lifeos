import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { PluginSettings } from '../type';

import { Date } from '../periodic/Date';
import { File } from '../periodic/File';
import { Component, MarkdownRenderer } from 'obsidian';

export class Resource {
  app: App;
  date: Date;
  settings: PluginSettings;
  file: File;
  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
    this.date = new Date(this.app, this.settings);
    this.file = new File(this.app, this.settings);
  }

  listByFolder = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const div = el.createEl('div');
    const markdown = this.file.list('3. Resources');
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
