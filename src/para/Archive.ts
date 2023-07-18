import type { MarkdownPostProcessorContext } from 'obsidian';
import { Base } from './Base';
import { Component, MarkdownRenderer } from 'obsidian';

export class Archive extends Base {
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
