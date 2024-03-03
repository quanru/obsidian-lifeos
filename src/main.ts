import { Plugin, setIcon } from 'obsidian';
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
import { DailyRecord } from './periodic/DailyRecord';
import { SettingTab } from './SettingTab';
import { LogLevel, type PluginSettings } from './type';
import { DEFAULT_SETTINGS } from './SettingTab';
import {
  DAILY,
  ERROR_MESSAGES,
  LIFE_OS_OFFICIAL_SITE,
  MONTHLY,
  QUARTERLY,
  WEEKLY,
  YEARLY,
} from './constant';
import { createPeriodicFile, logMessage, renderError } from './util';
import { CREATE_NOTE, CreateNoteView } from './view/CreateNote';
import dayjs from 'dayjs';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh';

const localeMap: Record<string, any> = {
  en: enUS,
  'en-us': enUS,
  zh: zhCN,
  'zh-cn': zhCN,
};
const locale = window.localStorage.getItem('language') || 'en';

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
  dailyRecord: DailyRecord;
  timeout: NodeJS.Timeout;
  interval: NodeJS.Timer;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!isPluginEnabled(app)) {
      logMessage(ERROR_MESSAGES.NO_DATAVIEW_INSTALL, LogLevel.error);
      return;
    }

    const dataviewApi = getAPI(app);

    if (!dataviewApi) {
      logMessage(ERROR_MESSAGES.FAILED_DATAVIEW_API, LogLevel.error);
      return;
    }

    this.app = app;
    this.dataview = dataviewApi;
  }

  async onload() {
    await this.loadSettings();
    this.registerView(CREATE_NOTE, (leaf) => {
      return new CreateNoteView(leaf, this.settings, localeMap[locale]);
    });

    const item = this.addRibbonIcon(
      'calendar',
      'Periodic PARA',
      this.initCreateNoteView
    );
    setIcon(item, 'calendar');

    this.addCommand({
      id: 'periodic-para-create-notes',
      name: 'Create Notes',
      callback: this.initCreateNoteView,
    });
    [DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map((periodType) => {
      this.addCommand({
        id: `periodic-para-create-${periodType.toLocaleLowerCase()}-note`,
        name: `Create ${periodType} Note`,
        callback: () => {
          createPeriodicFile(
            dayjs(),
            periodType,
            this.settings.periodicNotesPath,
            this.app
          );
        },
      });
    });
    this.addCommand({
      id: 'periodic-para-life-os-guide',
      name: 'LifeOS Guide',
      callback: () => (window.location.href = LIFE_OS_OFFICIAL_SITE),
    });
    this.app.workspace.onLayoutReady(this.initCreateNoteView);
    this.loadHelpers();
    this.loadDailyRecord();
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
          this.app,
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
          this.app,
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
  loadDailyRecord() {
    if (this.settings.usePeriodicNotes && this.settings.useDailyRecord) {
      this.dailyRecord = new DailyRecord(this.app, this.settings, this.file);
      this.addCommand({
        id: 'periodic-para-sync-daily-record',
        name: 'Sync Daily Records',
        callback: this.dailyRecord.sync,
      });
      this.addCommand({
        id: 'periodic-para-force-sync-daily-record',
        name: 'Force Sync Daily Records',
        callback: this.dailyRecord.forceSync,
      });

      clearTimeout(this.timeout);
      clearInterval(this.interval);

      // sync on start
      this.timeout = setTimeout(() => this.dailyRecord.sync(), 15 * 1000);
      // sync every 0.5 hour
      this.interval = setInterval(
        () => this.dailyRecord.sync(),
        0.5 * 60 * 60 * 1000
      );
    }
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
      FileListByTag: this.file.listByTag,
      ProjectListByTag: this.project.listByTag,
      AreaListByTag: this.area.listByTag,
      ResourceListByTag: this.resource.listByTag,
      ArchiveListByTag: this.archive.listByTag,
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
    this.loadDailyRecord();
  }

  loadHelpers() {
    this.task = new Task(this.app, this.settings, this.dataview);
    this.file = new File(this.app, this.settings, this.dataview);
    this.date = new Date(this.app, this.settings, this.file);
    this.bullet = new Bullet(this.app, this.settings, this.dataview);

    this.project = new Project(
      this.settings.projectsPath,
      this.app,
      this.settings,
      this.file
    );
    this.area = new Area(
      this.settings.areasPath,
      this.app,
      this.settings,
      this.file
    );
    this.resource = new Resource(
      this.settings.resourcesPath,
      this.app,
      this.settings,
      this.file
    );
    this.archive = new Archive(
      this.settings.archivesPath,
      this.app,
      this.settings,
      this.file
    );
  }

  loadGlobalHelpers() {
    (window as any).PeriodicPARA = {};
    (window as any).PeriodicPARA.Project = this.project;
    (window as any).PeriodicPARA.Area = this.area;
    (window as any).PeriodicPARA.Resource = this.resource;
    (window as any).PeriodicPARA.Archive = this.archive;
    (window as any).PeriodicPARA.Task = this.task;
    (window as any).PeriodicPARA.File = this.file;
    (window as any).PeriodicPARA.Bullet = this.bullet;
    (window as any).PeriodicPARA.Date = this.date;
  }

  initCreateNoteView = async () => {
    const leafs = this.app.workspace.getLeavesOfType(CREATE_NOTE);

    if (leafs.length > 0) {
      this.app.workspace.revealLeaf(leafs[0]);
      return;
    }

    let leaf;
    if ((this.app as any).isMobile) {
      leaf = this.app.workspace.getRightLeaf(false);
    } else {
      leaf = this.app.workspace.getLeftLeaf(false);
    }

    await leaf.setViewState({ type: CREATE_NOTE, active: true });
  };
}
