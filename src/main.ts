import { Notice, Plugin } from 'obsidian';
import type {
  App,
  MarkdownPostProcessorContext,
  PluginManifest,
} from 'obsidian';
import { DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

import { Project } from './para/Project';
import { Area } from './para/Area';
import { Resource } from './para/Resource';
import { Archive } from './para/Archive';
import { Task } from './periodic/Task';
import { Bullet } from './periodic/Bullet';
import { File } from './periodic/File';
import { Date } from './periodic/Date';
import type { PluginSettings } from './type';
import { ERROR_MESSAGES } from './constant';
import { renderError } from './util';
import { DEFAULT_SETTINGS, SettingTab } from './SettingTab';

export default class PeriodicPARA extends Plugin {
  settings: PluginSettings;
  project: Project;
  area: Area;
  resource: Resource;
  archive: Archive;
  task: Task;
  file: File;
  bullet: Bullet;
  date: Date;
  dataview: DataviewApi;
  views: Record<string, any>;

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
    this.loadViews();
    this.addSettingTab(new SettingTab(this.app, this));

    const handler = (
      source: keyof typeof this.views,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext
    ) => {
      const view = source.trim() as keyof typeof this.views;
      const legacyView = `${view}ByTime` as keyof typeof this.views;

      if (!view) {
        return renderError(
          ERROR_MESSAGES.NO_VIEW_PROVIDED,
          el.createEl('div'),
          ctx.sourcePath
        );
      }

      if (
        !Object.keys(this.views).includes(view) &&
        !Object.keys(this.views).includes(legacyView)
      ) {
        return renderError(
          `${ERROR_MESSAGES.NO_VIEW_EXISTED}: ${view}`,
          el.createEl('div'),
          ctx.sourcePath
        );
      }

      const callback = this.views[view] || this.views[legacyView];

      return callback(view, el, ctx);
    };
    this.registerMarkdownCodeBlockProcessor('PeriodicPARA', handler);
    this.registerMarkdownCodeBlockProcessor('periodic-para', handler); // for backward compatibility
  }
  loadViews() {
    this.views = {
      // views by time -> time context -> periodic notes
      ProjectListByTime: this.project.listByTime,
      AreaListByTime: this.area.listByTime,
      TaskRecordListByTime: this.task.recordListByTime,
      TaskDoneListByTime: this.task.doneListByTime,
      // views by tag -> topic context -> para
      TaskListByTag: this.task.listByTag,
      BulletListByTag: this.bullet.listByTag,
      // views by folder
      ProjectListByFolder: this.project.listByFolder,
      AreaListByFolder: this.area.listByFolder,
      ResourceListByFolder: this.resource.listByFolder,
      ArchiveListByFolder: this.archive.listByFolder,
    };
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.loadHelpers();
    this.loadGlobalHelpers();
    this.loadViews();
  }

  loadHelpers() {
    this.project = new Project(
      this.settings.projectsPath,
      this.app,
      this.settings
    );
    this.area = new Area(this.settings.areasPath, this.app, this.settings);
    this.resource = new Resource(
      this.settings.resourcesPath,
      this.app,
      this.settings
    );
    this.archive = new Archive(
      this.settings.archivesPath,
      this.app,
      this.settings
    );
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
