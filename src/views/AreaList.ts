import { Area } from '../para/Area';
import { Date } from '../periodic/Date';
import { Component, MarkdownPostProcessorContext, MarkdownRenderer } from 'obsidian';

export default async function (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const area = new Area(this.app);
  const date = new Date(this.app);
  const filename = this.app?.workspace?.getActiveFile()?.basename;
  const parsed = date.parse(filename);

  const scope = ['## 要事维度', '## 角色维度'];
  const areaList = await area.filter(parsed, scope);
  const div = el.createEl('div');
  const list: string[] = [];

  areaList.map((a: string, index: number) => {
    list.push(`${index + 1}. [[${a}|${a.match(/\/(.*)\//)[1]}]]`);
  });

  MarkdownRenderer.renderMarkdown(list.join('\n'), div, ctx.sourcePath, new Component());
}
