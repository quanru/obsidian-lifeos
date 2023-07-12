import type { App, MarkdownPostProcessorContext } from 'obsidian';
import type { DateType, PluginSettings } from '../type';

import { Date } from '../periodic/Date';
import { File } from '../periodic/File';
import { Component, MarkdownRenderer, TFile } from 'obsidian';

export class Area {
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

  async filter(
    condition: DateType = {
      year: null,
      month: null,
      quarter: null,
      week: null,
      day: null,
    },
    header: string
  ) {
    const { year } = condition;
    const quarterList = ['Q1', 'Q2', 'Q3', 'Q4'];
    const areaList: string[] = [];
    const tasks = [];

    for (let index = 0; index < quarterList.length; index++) {
      const quarter = quarterList[index];
      const file = this.app.vault.getAbstractFileByPath(
        // YYYY/YYYY-[Q]Q
        `${this.settings.periodicNotesPath}/${year}/${year}-${quarter}.md`
      );

      if (file instanceof TFile) {
        const reg = new RegExp(`# ${header}([\\s\\S]+?)\n#`);

        if (file) {
          tasks.push(async () => {
            const fileContent = await this.app.vault.read(file);
            const regMatch = fileContent.match(reg);
            const areaContent = regMatch?.length
              ? regMatch[1]?.split('\n')
              : [];
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
    }

    await Promise.all(tasks.map((task) => task()));

    return areaList;
  }

  listByFolder = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const div = el.createEl('div');
    const markdown = this.file.list('1. Projects');
    const component = new Component();

    component.load();

    return MarkdownRenderer.renderMarkdown(
      markdown,
      div,
      ctx.sourcePath,
      component
    );
  };

  listByTime = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const { basename: filename, path } = this.app.workspace.getActiveFile() || {
      filename: '',
      path: '',
    };
    const parsed = this.date.parse(filename);

    const header = this.settings.areaListHeader;
    const areaList = await this.filter(parsed, header);
    const div = el.createEl('div');
    const list: string[] = [];

    areaList.map((area: string, index: number) => {
      const file = this.app.metadataCache.getFirstLinkpathDest(area, path);
      const regMatch = file?.path.match(/\/(.*)\//);

      list.push(
        `${index + 1}. [[${area}|${regMatch?.length ? regMatch[1] : ''}]]`
      );
    });

    const component = new Component();

    component.load();

    return MarkdownRenderer.renderMarkdown(
      list.join('\n'),
      div,
      ctx.sourcePath,
      component
    );
  };
}
