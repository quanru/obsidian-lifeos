import { App, Notice, TFile, TFolder } from 'obsidian';
import type { PluginSettings } from '../type';
import { ERROR_MESSAGES } from '../constant';

export class File {
  app: App;
  date: Date;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
  }

  list(fileFolder: string) {
    const folder = this.app.vault.getAbstractFileByPath(fileFolder);

    if (folder instanceof TFolder) {
      const subFolderList = folder.children
        .sort()
        .filter((file) => file instanceof TFolder);
      const READMEList = subFolderList.map((subFolder, index: number) => {
        // 搜索 README，不存在的话，搜索第一个形如 XXX.README 的
        if (subFolder instanceof TFolder) {
          const files = subFolder.children;

          const README = files.find((file) =>
            file.path.match(/(.*\.)?README\.md/)
          );

          if (!README) {
            new Notice(ERROR_MESSAGES.NO_README_EXIST + subFolder.path);
          }

          if (README instanceof TFile) {
            const link = this.app.metadataCache.fileToLinktext(README, README?.path);
            return `${index + 1}. [[${link}|${subFolder.name}]]`;
          }
        }
      });

      return READMEList.join('\n');
    }

    return `No files in ${fileFolder}`;
  }
}
