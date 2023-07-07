import { Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type {
  App,
  MarkdownPostProcessorContext,
  PluginManifest,
} from 'obsidian';
import { DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

import { Project } from './para/Project';
import { Area } from './para/Area';
import { Task } from './periodic/Task';
import { Bullet } from './periodic/Bullet';
import { File } from './periodic/File';
import { Date } from './periodic/Date';
import type { PluginSettings } from './type';
import { ERROR_MESSAGES } from './constant';
import { renderError } from './util';

const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
};

export default class PeriodicPARA extends Plugin {
  settings: PluginSettings;
  project: Project;
  area: Area;
  task: Task;
  file: File;
  bullet: Bullet;
  date: Date;
  dataview: DataviewApi;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!isPluginEnabled(app)) {
      new Notice(ERROR_MESSAGES.NO_DATAVIEW_INSTALL);
      throw Error(ERROR_MESSAGES.NO_DATAVIEW_INSTALL);
    }

    const dataviewApi = getAPI(app);

    if (!dataviewApi) {
      new Notice(ERROR_MESSAGES.FAILED_DATAVIEW_API);
      throw Error(ERROR_MESSAGES.FAILED_DATAVIEW_API);
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
      // views by time -> time context -> periodic notes
      ProjectListByTime: this.project.listByTime,
      AreaListByTime: this.area.listByTime,
      TaskRecordListByTime: this.task.recordListByTime,
      TaskDoneListByTime: this.task.doneListByTime,
      // views by tag -> topic context -> para
      TaskListByTag: this.task.listByTag,
      BulletListByTag: this.bullet.listByTag,
    };

    this.registerMarkdownCodeBlockProcessor(
      'periodic-para',
      (
        source: keyof typeof views,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
      ) => {
        const view = source.trim() as keyof typeof views;

        if (!view) {
          return renderError(
            ERROR_MESSAGES.NO_VIEW_PROVIDED,
            el.createEl('div'),
            ctx.sourcePath
          );
        }

        if (!Object.keys(views).includes(view)) {
          return renderError(
            `${ERROR_MESSAGES.NO_VIEW_EXISTED}: ${view}`,
            el.createEl('div'),
            ctx.sourcePath
          );
        }

        const callback =
          views[view] || views[`${view}ByTime` as keyof typeof views];

        return callback(view, el, ctx);
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
    this.bullet = new Bullet(this.app, this.settings, this.dataview);
  }

  loadGlobalHelpers() {
    (window as any).PeriodicPARA = {};
    (window as any).PeriodicPARA.Project = this.project;
    (window as any).PeriodicPARA.Area = this.area;
    (window as any).PeriodicPARA.Task = this.task;
    (window as any).PeriodicPARA.File = this.file;
    (window as any).PeriodicPARA.Bullet = this.bullet;
    (window as any).PeriodicPARA.Date = this.date;
  }
}

class SettingTab extends PluginSettingTab {
  plugin: PeriodicPARA;

  constructor(app: App, plugin: PeriodicPARA) {
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
