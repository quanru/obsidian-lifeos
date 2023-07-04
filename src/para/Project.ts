import { App, TFile, moment } from 'obsidian';
import { Date } from 'src/periodic/Date';
import {
  Component,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
} from 'obsidian';
import type { TaskConditionType, PluginSettings } from 'src/type';

export class Project {
  app: App;
  date: Date;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
    this.date = new Date(this.app, this.settings);
  }

  timeAdd(timeString1: string, timeString2: string) {
    if (!timeString1) {
      return timeString2;
    }

    if (!timeString2) {
      return timeString1;
    }

    const reg = /(\d+)hr(\d+)?/;
    const [, hr1 = 0, min1 = 0] = timeString1.match(reg) || [];
    const [, hr2 = 0, min2 = 0] = timeString2.match(reg) || [];
    let carry = 0;
    const hr = Number(hr1) + Number(hr2);
    let min = Number(min1) + Number(min2);

    if (min >= 60) {
      carry = Number((min / 60).toFixed(0));
      min = min % 60;
    }

    return `${hr + carry}hr${min}`;
  }

  timePercent(timeString1: string, timeString2: string) {
    if (!timeString1) {
      return '';
    }

    if (!timeString2) {
      return '';
    }

    const reg = /(\d+)hr(\d+)?/;
    const [, hr1 = 0, min1 = 0] = timeString1.match(reg) || [];
    const [, hr2 = 0, min2 = 0] = timeString2.match(reg) || [];
    const time1 = Number(hr1) * 60 + Number(min1);
    const time2 = Number(hr2) * 60 + Number(min2);

    return ((time1 / time2) * 100).toFixed(2) + '%';
  }

  async filter(
    condition: TaskConditionType = {
      from: '',
      to: '',
    },
    scope: string[]
  ) {
    const { from, to } = condition;
    const timeReg = /\d+hr(\d+)?/;
    let day = from;
    const projectList: string[] = [];
    const projectTimeConsume: Record<string, string> = {};
    let totalTime = '';
    const tasks = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const momentDay = moment(day);
      const file = this.app.vault.getAbstractFileByPath(
        `${this.settings.periodicNotesPath}/${momentDay.year()}/Daily/${String(
          momentDay.month() + 1
        ).padStart(2, '0')}/${momentDay.format('YYYY-MM-DD')}.md`
      ) as TFile;
      const reg = new RegExp(`${scope[0]}([\\s\\S]*)${scope[1]}`);

      if (file) {
        let todayTotalTime = '0hr0';
        tasks.push(async () => {
          const fileContent = await this.app.vault.read(file);
          const regMatch = fileContent.match(reg);
          const projectContent = regMatch?.length
            ? regMatch[1]?.split('\n')
            : [];

          projectContent.map((project) => {
            if (!project) {
              return;
            }

            if (project.match(timeReg)) {
              // 特殊处理总耗时
              todayTotalTime = project;
            }

            const realProject = (project.match(/\[\[(.*)\|?(.*)\]\]/) ||
              [])[1]?.replace(/\|.*/, '');

            if (!realProject) {
              return;
            }

            const [projectTime = ''] = project.match(timeReg) || [];

            projectTimeConsume[realProject] = this.timeAdd(
              projectTimeConsume[realProject],
              projectTime
            );

            if (!projectList.includes(realProject)) {
              projectList.push(realProject);
            }
          });

          totalTime = this.timeAdd(totalTime, todayTotalTime);
        });
      }

      if (day === to) {
        break;
      }

      day = momentDay.add(1, 'day').format('YYYY-MM-DD');
    }

    await Promise.all(tasks.map((task) => task()));
    Object.keys(projectTimeConsume).map((project) => {
      projectTimeConsume[project] = projectTimeConsume[project]
        ? `${projectTimeConsume[project]}/${totalTime}=${this.timePercent(
            projectTimeConsume[project],
            totalTime
          )}`
        : '';
    });

    return {
      projectList,
      projectTimeConsume,
      totalTime,
    };
  }

  list = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const project = new Project(this.app, this.settings);
    const date = new Date(this.app, this.settings);
    const filename = this.app.workspace.getActiveFile()?.basename;
    const parsed = date.days(date.parse(filename));

    const scope = ['## 项目列表', '## 日常记录'];
    const { projectList, projectTimeConsume } = await project.filter(
      parsed,
      scope
    );
    const div = el.createEl('div');
    const list: string[] = [];
    const reg = /\/(.*)\//;

    projectList.map((project: string, index: number) => {
      const regMatch = project.match(reg);
      list.push(
        `${index + 1}. [[${project}|${regMatch?.length ? regMatch[1] : ''}]] ${
          projectTimeConsume[project]
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
}
