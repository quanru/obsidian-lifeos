import { Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
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

const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
  projectsPath: '1. Projects',
  areasPath: '2. Areas',
  resourcesPath: '3. Resources',
  archivesPath: '4. Archives',
  projectListHeader: 'Project List',
  areaListHeader: 'First Things Dimension',
  habitHeader: 'Habit',
};

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
    this.addSettingTab(new SettingTab(this.app, this));

    const views = {
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
    const handler = (
      source: keyof typeof views,
      el: HTMLElement,
      ctx: MarkdownPostProcessorContext
    ) => {
      const view = source.trim() as keyof typeof views;
      const legacyView = `${view}ByTime` as keyof typeof views;

      if (!view) {
        return renderError(
          ERROR_MESSAGES.NO_VIEW_PROVIDED,
          el.createEl('div'),
          ctx.sourcePath
        );
      }

      if (
        !Object.keys(views).includes(view) &&
        !Object.keys(views).includes(legacyView)
      ) {
        return renderError(
          `${ERROR_MESSAGES.NO_VIEW_EXISTED}: ${view}`,
          el.createEl('div'),
          ctx.sourcePath
        );
      }

      const callback = views[view] || views[legacyView];

      return callback(view, el, ctx);
    };
    this.registerMarkdownCodeBlockProcessor('PeriodicPARA', handler);
    this.registerMarkdownCodeBlockProcessor('periodic-para', handler); // for backward compatibility
  }

  onunload() {}

  async loadSettings() {
    // const periodicNotesPluginSettings = await this.app.plugins
    //   .getPlugin('periodic-notes')
    //   .loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadHelpers() {
    this.project = new Project(this.settings.projectsPath, this.app, this.settings);
    this.area = new Area(this.settings.areasPath, this.app, this.settings);
    this.resource = new Resource(this.settings.resourcesPath, this.app, this.settings);
    this.archive = new Archive(this.settings.archivesPath, this.app, this.settings);
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

    containerEl.createEl('h2', { text: 'Advanced.' });

    new Setting(containerEl)
      .setName('Periodic Notes Folder:')
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.periodicNotesPath)
          .setValue(this.plugin.settings.periodicNotesPath)
          .onChange(async (value) => {
            this.plugin.settings.periodicNotesPath = value;
            await this.plugin.saveSettings();
          })
    );
    
    new Setting(containerEl)
    .setName('Projects Folder:')
    .addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.projectsPath)
        .setValue(this.plugin.settings.projectsPath)
        .onChange(async (value) => {
          this.plugin.settings.projectsPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
    .setName('Areas Folder:')
    .addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.areasPath)
        .setValue(this.plugin.settings.areasPath)
        .onChange(async (value) => {
          this.plugin.settings.areasPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
    .setName('Resources Folder:')
    .addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.resourcesPath)
        .setValue(this.plugin.settings.resourcesPath)
        .onChange(async (value) => {
          this.plugin.settings.resourcesPath = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
    .setName('Archives Folder:')
    .addText((text) =>
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
          })
      );
  }
}
