import { App, MarkdownPostProcessorContext, TFile, TFolder } from 'obsidian';
import type { PluginSettings } from '../type';

import {
  DAILY_REG,
  WEEKLY_REG,
  MONTHLY_REG,
  QUARTERLY_REG,
  YEARLY_REG,
  ERROR_MESSAGES,
} from '../constant';
import { DataviewApi } from 'obsidian-dataview';
import { logMessage, renderError } from '../util';
import { Markdown } from '../component/Markdown';
import dayjs from 'dayjs';

export class File {
  app: App;
  date: Date;
  settings: PluginSettings;
  dataview: DataviewApi;
  constructor(app: App, settings: PluginSettings, dataview: DataviewApi) {
    this.app = app;
    this.settings = settings;
    this.dataview = dataview;
  }

  private hasCommonPrefix(tags1: string[], tags2: string[]) {
    for (const tag1 of tags1) {
      for (const tag2 of tags2) {
        if (tag1.startsWith(tag2)) {
          return true;
        }
      }
    }
    return false;
  }

  list(fileFolder: string, condition: { tags: string[] } = { tags: [] }) {
    const folder = this.app.vault.getAbstractFileByPath(fileFolder);

    if (folder instanceof TFolder) {
      const subFolderList = folder.children
        .sort()
        .filter((file) => file instanceof TFolder);
      const READMEList = subFolderList
        .map((subFolder) => {
          // 搜索 README，不存在的话，搜索第一个形如 XXX.README 的
          if (subFolder instanceof TFolder) {
            const files = subFolder.children;

            const README = files.find((file) =>
              file.path.match(/(.*\.)?README\.md/)
            );

            if (condition.tags.length) {
              const tags = this.tags(README?.path || '');
              // tags: #work/project-1 #work/project-2
              // condition.tags: #work
              if (!this.hasCommonPrefix(tags, condition.tags)) {
                return '';
              }
            }

            if (!README) {
              logMessage(ERROR_MESSAGES.NO_README_EXIST + subFolder.path);
            }

            if (README instanceof TFile) {
              const link = this.app.metadataCache.fileToLinktext(
                README,
                README?.path
              );
              return `[[${link}|${subFolder.name}]]`;
            }
          }
        })
        .filter((link) => !!link)
        .map((link, index: number) => `${index + 1}. ${link}`);

      return READMEList.join('\n');
    }

    return `No files in ${fileFolder}`;
  }

  get(link: string, sourcePath = '', fileFolder?: string) {
    const file = this.app.metadataCache.getFirstLinkpathDest(link, sourcePath);

    if (!fileFolder) {
      return file;
    }

    if (file?.path.includes(fileFolder)) {
      return file;
    }
  }

  tags(filePath: string) {
    let {
      frontmatter: { tags },
    } = this.dataview.page(filePath)?.file || { frontmatter: {} };

    if (!tags) {
      return [];
    }

    if (typeof tags === 'string') {
      tags = [tags];
    }

    return tags;
  }

  listByTag = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    const filepath = ctx.sourcePath;
    const tags = this.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);
    const periodicNotesPath = this.settings.periodicNotesPath;

    if (!tags.length) {
      return renderError(
        this.app,
        ERROR_MESSAGES.NO_FRONT_MATTER_TAG,
        div,
        filepath
      );
    }

    const from = tags
      .map((tag: string[], index: number) => {
        return `#${tag} ${index === tags.length - 1 ? '' : 'OR'}`;
      })
      .join(' ')
      .trim();

    this.dataview.table(
      ['File', 'Date'],
      this.dataview
        .pages(from)
        .filter(
          (b) =>
            !b.file.name?.match(YEARLY_REG) &&
            !b.file.name?.match(QUARTERLY_REG) &&
            !b.file.name?.match(MONTHLY_REG) &&
            !b.file.name?.match(WEEKLY_REG) &&
            !b.file.name?.match(DAILY_REG) &&
            !b.file.name?.match(/Template$/) &&
            !b.file.path?.includes(`${periodicNotesPath}/Templates`)
        )
        .sort((b) => b.file.ctime, 'desc')
        .map((b) => [
          b.file.link,
          `[[${dayjs(b.file.ctime.ts).format('YYYY-MM-DD')}]]`,
        ]),
      div,
      component,
      filepath
    );

    ctx.addChild(component);
  };
}
