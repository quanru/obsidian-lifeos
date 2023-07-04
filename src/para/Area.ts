import type { DateType, PluginSettings } from 'src/type';
import { Date } from 'src/periodic/Date';
import {
  App,
  Component,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  TFile,
} from 'obsidian';

export class Area {
  app: App;
  date: Date;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
    this.date = new Date(this.app, this.settings);
  }

  async filter(
    condition: DateType = {
      year: null,
      month: null,
      quarter: null,
      week: null,
      day: null,
    },
    scope: string[]
  ) {
    const { year } = condition;
    const quarterList = ['Q1', 'Q2', 'Q3', 'Q4'];
    const areaList: string[] = [];
    const tasks = [];

    for (let index = 0; index < quarterList.length; index++) {
      const quarter = quarterList[index];
      const file = this.app.vault.getAbstractFileByPath(
        `${this.settings.periodicNotesPath}/${year}/${year}-${quarter}.md`
      ) as TFile;
      const reg = new RegExp(`${scope[0]}([\\s\\S]*)${scope[1]}`);

      if (file) {
        tasks.push(async () => {
          const fileContent = await this.app.vault.read(file);
          const regMatch = fileContent.match(reg);
          const areaContent = regMatch?.length ? regMatch[1]?.split('\n') : [];
          areaContent.map((area) => {
            if (!area) {
              return;
            }

            const realArea = (area.match(/\[\[(.*)\|?(.*)\]\]/) ||
              [])[1]?.replace(/\|.*/, '');
            if (realArea && !areaList.includes(realArea)) {
              areaList.push(realArea);
            }
          });
        });
      }
    }

    await Promise.all(tasks.map((task) => task()));

    return areaList;
  }

  list = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filename = this.app.workspace.getActiveFile()?.basename;
    const parsed = this.date.parse(filename);

    const scope = ['## 要事维度', '## 角色维度'];
    const areaList = await this.filter(parsed, scope);
    const div = el.createEl('div');
    const list: string[] = [];
    const reg = /\/(.*)\//;

    areaList.map((area: string, index: number) => {
      const regMatch = area.match(reg);
      list.push(
        `${index + 1}. [[${area}|${regMatch?.length ? regMatch[1] : ''}]]`
      );
    });

    MarkdownRenderer.renderMarkdown(
      list.join('\n'),
      div,
      ctx.sourcePath,
      new Component()
    );
  };
}
