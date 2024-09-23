import {
  type App,
  type MarkdownPostProcessorContext,
  TFile,
  TFolder,
} from 'obsidian';
import type { PluginSettings } from '../type';

import dayjs from 'dayjs';
import type { DataviewApi } from 'obsidian-dataview';
import { Markdown } from '../component/Markdown';
import { ERROR_MESSAGE } from '../constant';
import { getI18n } from '../i18n';
import {
  isInPeriodicNote,
  isInTemplateNote,
  logMessage,
  renderError,
} from '../util';

export class File {
  app: App;
  date: Date;
  settings: PluginSettings;
  dataview: DataviewApi;
  locale: string;
  constructor(
    app: App,
    settings: PluginSettings,
    dataview: DataviewApi,
    locale: string,
  ) {
    this.app = app;
    this.settings = settings;
    this.dataview = dataview;
    this.locale = locale;
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
      const subFolderList = folder.children.filter(
        file => file instanceof TFolder,
      );
      const IndexList = subFolderList
        .map(subFolder => {
          // 优先搜索同名文件，否则搜索 XXX.README
          if (subFolder instanceof TFolder) {
            const { name } = subFolder;
            const files = subFolder.children;
            const indexFile = files.find(file => {
              if ((file as any).basename === name) {
                return true;
              }
              if (file.path.match(/(.*\.)?README\.md/)) {
                return true;
              }
            });

            if (condition.tags.length) {
              const tags = this.tags(indexFile?.path || '');
              // tags: #work/project-1 #work/project-2
              // condition.tags: #work
              if (!tags) {
                return '';
              }

              if (!condition.tags) {
                return '';
              }

              if (!this.hasCommonPrefix(tags, condition.tags)) {
                return '';
              }
            }

            if (!indexFile) {
              logMessage(
                `${
                  getI18n(this.locale)[`${ERROR_MESSAGE}NO_INDEX_FILE_EXIST`]
                } @ ${subFolder.path}`,
              );
            }

            if (indexFile instanceof TFile) {
              const link = this.app.metadataCache.fileToLinktext(
                indexFile,
                indexFile?.path,
              );
              return `[[${link}|${subFolder.name}]]`;
            }
          }
        })
        .filter(link => !!link)
        .sort((a, b) => {
          const getCategory = (item: string) =>
            item.split('|')[1].replace(']]', '');

          const categoryA = getCategory(a as string);
          const categoryB = getCategory(b as string);

          if (categoryA < categoryB) return -1;
          if (categoryA > categoryB) return 1;

          return 0;
        })
        .map((link, index: number) => `${index + 1}. ${link}`);

      return IndexList.join('\n');
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
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (file instanceof TFile) {
      const { frontmatter } = this.app.metadataCache.getFileCache(file) || {
        frontmatter: {},
      };

      let tags = frontmatter?.tags;

      if (!tags) {
        return [];
      }

      if (typeof tags === 'string') {
        tags = [tags];
      }

      return tags.map((tag: string) => tag.replace(/^#(.*)$/, '$1'));
    }
  }

  listByTag = async (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    const filepath = ctx.sourcePath;
    const tags = this.tags(filepath);
    const div = el.createEl('div');
    const component = new Markdown(div);

    if (!tags.length) {
      return renderError(
        this.app,
        getI18n(this.locale)[`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`],
        div,
        filepath,
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
          (b: { file: TFile }) =>
            !isInPeriodicNote(b.file.path, this.settings) &&
            !isInTemplateNote(filepath, this.settings),
        )
        .sort(
          (b: { file: { ctime: { ts: number } } }) => b.file.ctime.ts,
          'desc',
        )
        .map((b: { file: { link: string; ctime: { ts: number } } }) => [
          b.file.link,
          `[[${dayjs(b.file.ctime.ts).format('YYYY-MM-DD')}]]`,
        ]),
      div,
      component,
      filepath,
    );

    ctx.addChild(component);
  };
}
