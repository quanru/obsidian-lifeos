import { PluginSettingTab, Setting } from 'obsidian';
import debounce from 'debounce';
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
  dailyRecordHeader: 'Daily Record',
  dailyRecordAPI: '',
  dailyRecordToken: '',
  useDailyRecord: false,
  usePeriodicNotes: true,
  usePARANotes: true,
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

    containerEl.createEl('h1', { text: 'Periodic Notes Settings.' });

    new Setting(containerEl)
      .setName('Enable')
      .setDesc('Whether to turn on Periodic Notes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.usePeriodicNotes)
          .onChange(async (value) => {
            this.plugin.settings.usePeriodicNotes = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.usePeriodicNotes) {
      new Setting(containerEl)
        .setName('Periodic Notes Folder:')
        .addText((text) =>
          text
            .setPlaceholder(DEFAULT_SETTINGS.periodicNotesPath)
            .setValue(this.plugin.settings.periodicNotesPath)
            .onChange(
              debounce(async (value) => {
                this.plugin.settings.periodicNotesPath = value;
                await this.plugin.saveSettings();
              }, 500)
            )
        );

      new Setting(containerEl)
        .setName('Habit Header:')
        .setDesc('Where the Habit module is in a daily note')
        .addText((text) =>
          text
            .setPlaceholder(DEFAULT_SETTINGS.habitHeader)
            .setValue(this.plugin.settings.habitHeader)
            .onChange(
              debounce(async (value) => {
                this.plugin.settings.habitHeader = value;
                await this.plugin.saveSettings();
              }, 500)
            )
        );

      new Setting(containerEl)
        .setName('Project List Header:')
        .setDesc('Where the Project List is in a daily note')
        .addText((text) =>
          text
            .setPlaceholder(DEFAULT_SETTINGS.projectListHeader)
            .setValue(this.plugin.settings.projectListHeader)
            .onChange(
              debounce(async (value) => {
                this.plugin.settings.projectListHeader = value;
                await this.plugin.saveSettings();
              }, 500)
            )
        );

      new Setting(containerEl)
        .setName('Area List Header:')
        .setDesc('Where the Area List is in a quarterly note')
        .addText((text) =>
          text
            .setPlaceholder(DEFAULT_SETTINGS.areaListHeader)
            .setValue(this.plugin.settings.areaListHeader)
            .onChange(
              debounce(async (value) => {
                this.plugin.settings.areaListHeader = value;
                await this.plugin.saveSettings();
              }, 500)
            )
        );

      new Setting(containerEl)
        .setName('Daily Record')
        .setDesc('Sync daily record by remote API')
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.useDailyRecord)
            .onChange(async (value) => {
              this.plugin.settings.useDailyRecord = value;
              await this.plugin.saveSettings();
              this.display();
            })
        );

      if (this.plugin.settings.useDailyRecord) {
        new Setting(containerEl)
          .setName('Header:')
          .setDesc('Where the Daily Record module is in a daily note')
          .addText((text) =>
            text
              .setPlaceholder(DEFAULT_SETTINGS.dailyRecordHeader)
              .setValue(this.plugin.settings.dailyRecordHeader)
              .onChange(
                debounce(async (value) => {
                  this.plugin.settings.dailyRecordHeader = value;
                  await this.plugin.saveSettings();
                }, 500)
              )
          );

        new Setting(containerEl)
          .setName('API:')
          .setDesc('The daily record API')
          .addText((text) =>
            text
              .setPlaceholder(DEFAULT_SETTINGS.dailyRecordAPI)
              .setValue(this.plugin.settings.dailyRecordAPI)
              .onChange(
                debounce(async (value) => {
                  this.plugin.settings.dailyRecordAPI = value;
                  await this.plugin.saveSettings();
                }, 500)
              )
          );

        new Setting(containerEl)
          .setName('Token:')
          .setDesc('The token of your API')
          .addText((text) =>
            text
              .setPlaceholder(DEFAULT_SETTINGS.dailyRecordToken)
              .setValue(this.plugin.settings.dailyRecordToken)
              .onChange(
                debounce(async (value) => {
                  this.plugin.settings.dailyRecordToken = value;
                  await this.plugin.saveSettings();
                }, 500)
              )
          );
      }
    }

    containerEl.createEl('h1', { text: 'P.A.R.A Notes Settings.' });

    new Setting(containerEl)
      .setName('Enable')
      .setDesc('Whether to turn on PARA Notes')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.usePARANotes)
          .onChange(async (value) => {
            this.plugin.settings.usePARANotes = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.usePARANotes) {
      new Setting(containerEl).setName('Projects Folder:').addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.projectsPath)
          .setValue(this.plugin.settings.projectsPath)
          .onChange(
            debounce(async (value) => {
              this.plugin.settings.projectsPath = value;
              await this.plugin.saveSettings();
            }, 500)
          )
      );

      new Setting(containerEl).setName('Areas Folder:').addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.areasPath)
          .setValue(this.plugin.settings.areasPath)
          .onChange(
            debounce(async (value) => {
              this.plugin.settings.areasPath = value;
              await this.plugin.saveSettings();
            }, 500)
          )
      );
      new Setting(containerEl).setName('Resources Folder:').addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.resourcesPath)
          .setValue(this.plugin.settings.resourcesPath)
          .onChange(
            debounce(async (value) => {
              this.plugin.settings.resourcesPath = value;
              await this.plugin.saveSettings();
            }, 500)
          )
      );

      new Setting(containerEl).setName('Archives Folder:').addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.archivesPath)
          .setValue(this.plugin.settings.archivesPath)
          .onChange(
            debounce(async (value) => {
              this.plugin.settings.archivesPath = value;
              await this.plugin.saveSettings();
            }, 500)
          )
      );
    }
  }
}
