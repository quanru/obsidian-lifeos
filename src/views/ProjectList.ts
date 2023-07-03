import { Project } from '../para/Project';
import { Date } from '../periodic/Date';
import { Component, MarkdownPostProcessorContext, MarkdownRenderer } from 'obsidian';

export default async function (
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const project = new Project(this.app);
  const date = new Date(this.app);
  const filename = this.app?.workspace?.getActiveFile()?.basename;
  const parsed = date.days(date.parse(filename));

  const scope = ['## 项目列表', '## 日常记录'];
  const { projectList, projectTimeConsume, totalTime } = await project.filter(
    parsed,
    scope
  );
  const div = el.createEl('div');
  const list: string[] = [];

  projectList.map((p: string, index: number) => {
    list.push(
      `${index + 1}. [[${p}|${p.match(/\/(.*)\//)[1]}]] ${
        projectTimeConsume[p]
      }`
    );
  });
  MarkdownRenderer.renderMarkdown(
    list.join('\n'),
    div,
    ctx.sourcePath,
    new Component()
  );
}
