import type { App, TFile } from 'obsidian';
import { TFolder } from 'obsidian';
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
    const file = this.app.vault.getAbstractFileByPath(fileFolder);

    if (file instanceof TFolder) {
      const READMEList = file.children
        .sort()
        .filter((area: TFile) => area.extension !== 'md')
        .map((area, index: number) => {
          return `${index + 1}. [[${area.path}/README|${area.name}]]`;
        });

      return READMEList.join('\n');
    }
  }
}
