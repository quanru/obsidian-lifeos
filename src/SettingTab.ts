import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type PeriodicPARA from './main';
import type { PluginSettings } from './type';

export const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
  projectsPath: '1. Projects',
  areasPath: '2. Areas',
  resourcesPath: '3. Resources',
  archivesPath: '4. Archives',
  projectListHeader: 'Project List',
  areaListHeader: 'First Things Dimension',
  habitHeader: 'Habit',
};

export class SettingTab extends PluginSettingTab {
  plugin: PeriodicPARA;

  constructor(app: App, plugin: PeriodicPARA) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Advanced.' });

    new Setting(containerEl).setName('Periodic Notes Folder:').addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.periodicNotesPath)
        .setValue(this.plugin.settings.periodicNotesPath)
        .onChange(async (value) => {
          this.plugin.settings.periodicNotesPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Projects Folder:').addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.projectsPath)
        .setValue(this.plugin.settings.projectsPath)
        .onChange(async (value) => {
          this.plugin.settings.projectsPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Areas Folder:').addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.areasPath)
        .setValue(this.plugin.settings.areasPath)
        .onChange(async (value) => {
          this.plugin.settings.areasPath = value;
          await this.plugin.saveSettings();
        })
    );
    new Setting(containerEl).setName('Resources Folder:').addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.resourcesPath)
        .setValue(this.plugin.settings.resourcesPath)
        .onChange(async (value) => {
          this.plugin.settings.resourcesPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl).setName('Archives Folder:').addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.archivesPath)
        .setValue(this.plugin.settings.archivesPath)
        .onChange(async (value) => {
          this.plugin.settings.archivesPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('Project List Header:')
      .setDesc('Where the Project List is in a daily note')
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.projectListHeader)
          .setValue(this.plugin.settings.projectListHeader)
          .onChange(async (value) => {
            this.plugin.settings.projectListHeader = value;
            await this.plugin.saveSettings();
            this.plugin.loadHelpers();
            this.plugin.loadGlobalHelpers();
          })
      );

    new Setting(containerEl)
      .setName('Area List Header:')
      .setDesc('Where the Area List is in a quarterly note')
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.areaListHeader)
          .setValue(this.plugin.settings.areaListHeader)
          .onChange(async (value) => {
            this.plugin.settings.areaListHeader = value;
            await this.plugin.saveSettings();
            this.plugin.loadHelpers();
            this.plugin.loadGlobalHelpers();
          })
      );

    new Setting(containerEl)
      .setName('Habit Header:')
      .setDesc('Where the Habit module is in a daily note')
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.habitHeader)
          .setValue(this.plugin.settings.habitHeader)
          .onChange(async (value) => {
            this.plugin.settings.habitHeader = value;
            await this.plugin.saveSettings();
            this.plugin.loadHelpers();
            this.plugin.loadGlobalHelpers();
          })
      );
  }
}
