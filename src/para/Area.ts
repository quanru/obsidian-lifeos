import type { MarkdownPostProcessorContext } from 'obsidian';
import type { DateType } from '../type';

import { MarkdownRenderer, TFile } from 'obsidian';
import { Item } from './Item';
import { Markdown } from '../component/Markdown';
import { generateHeaderRegExp } from '../util';

export class Area extends Item {
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
      const link = `${year}/Quarterly/${year}-${quarter}.md`;
      const file = this.file.get(link, '', this.settings.periodicNotesPath);

      if (file instanceof TFile) {
        const reg = generateHeaderRegExp(header);

        if (file) {
          tasks.push(async () => {
            const fileContent = await this.app.vault.cachedRead(file);
            const regMatch = fileContent.match(reg);
            const areaContent = regMatch?.length
              ? regMatch[2]?.split('\n')
              : [];
            areaContent.map((area) => {
              if (!area) {
                return;
              }

              const realArea = (area.match(/\d+\. \[\[(.*)\|?(.*)\]\]/) ||
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

  listByTime = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filename = ctx.sourcePath;
    const parsed = this.date.parse(filename);

    const header = this.settings.areaListHeader;
    const areaList = await this.filter(parsed, header);
    const div = el.createEl('div');
    const list: string[] = [];

    areaList.map((area: string, index: number) => {
      const file = this.file.get(area);

      const regMatch = file?.path.match(/\/(.*)\//);

      list.push(
        `${index + 1}. [[${area}|${regMatch?.length ? regMatch[1] : ''}]]`
      );
    });

    const component = new Markdown(div);

    MarkdownRenderer.render(
      this.app,
      list.join('\n'),
      div,
      ctx.sourcePath,
      component
    );

    ctx.addChild(component);
  };
}
