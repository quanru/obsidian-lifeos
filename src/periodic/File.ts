import type { App, TFile, TFolder } from 'obsidian';
import { PluginSettings } from 'src/type';

export class File {
  app: App;
  date: Date;
  settings: PluginSettings;
  constructor(app: App, settings: PluginSettings) {
    this.app = app;
    this.settings = settings;
  }

  list(fileFolder: string) {
    const READMEList = (
      this.app.vault.getAbstractFileByPath(fileFolder) as TFolder
    ).children
      .sort()
      .filter((area: TFile) => area.extension !== 'md')
      .map((area, index: number) => {
        return `${index + 1}. [[${area.path}/README|${area.name}]]`;
      });

    return READMEList.join('\n');
  }
}
