import {
  App,
  MarkdownPostProcessorContext,
  Notice,
  Plugin,
  PluginManifest,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import { DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

import { Project } from 'src/para/Project';
import { Area } from 'src/para/Area';
import { Task } from 'src/periodic/Task';
import { File } from 'src/periodic/File';
import { Date } from 'src/periodic/Date';
import type { PluginSettings } from 'src/type';

const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
};

export default class MyPlugin extends Plugin {
  settings: PluginSettings;
  project: Project;
  area: Area;
  task: Task;
  file: File;
  date: Date;
  dataview: DataviewApi;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!isPluginEnabled(app)) {
      new Notice('You need to install dataview first!');
      throw Error('dataview is not available!');
    }

    const dataviewApi = getAPI(app);

    if (!dataviewApi) {
      new Notice('Dataview API enable failed!');
      throw Error('dataview api enable failed!');
    }

    this.app = app;
    this.dataview = dataviewApi;
  }

  async onload() {
    await this.loadSettings();

    this.loadHelpers();
    this.loadGlobalHelpers();
    // this.addSettingTab(new SettingTab(this.app, this));

    const views = {
      ProjectList: this.project.list,
      AreaList: this.area.list,
      TaskRecordList: this.task.recordList,
      TaskDoneList: this.task.doneList,
    };

    this.registerMarkdownCodeBlockProcessor(
      'periodic-para',
      (
        source: keyof typeof views,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        if (!source) {
          throw new Error(`Please provide a view name!`);
        }

        if (!Object.keys(views).includes(source)) {
          throw new Error(`There is no view for ${source} in this plugin`);
        }

        return views[source](source, el, ctx);
      }
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadHelpers() {
    this.project = new Project(this.app, this.settings);
    this.area = new Area(this.app, this.settings);
    this.task = new Task(this.app, this.settings, this.dataview);
    this.file = new File(this.app, this.settings);
    this.date = new Date(this.app, this.settings);
  }

  loadGlobalHelpers() {
    (window as any).PeriodicPARA = {};
    (window as any).PeriodicPARA.Project = this.project;
    (window as any).PeriodicPARA.Area = this.area;
    (window as any).PeriodicPARA.Task = this.task;
    (window as any).PeriodicPARA.File = this.file;
    (window as any).PeriodicPARA.Date = this.date;
  }
}

class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Settings for Periodic PARA plugin.' });

    new Setting(containerEl)
      .setName('Periodic notes folder')
      .setDesc("It's a Periodic notes folder")
      .addText((text) =>
        text
          .setPlaceholder('Enter your Periodic notes folder')
          .setValue(this.plugin.settings.periodicNotesPath)
          .onChange(async (value) => {
            console.log('Periodic Notes folder: ' + value);
            this.plugin.settings.periodicNotesPath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
