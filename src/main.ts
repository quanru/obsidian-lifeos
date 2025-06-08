import { Platform, Plugin, setIcon } from 'obsidian';
import type { App, MarkdownPostProcessorContext, PluginManifest, WorkspaceLeaf } from 'obsidian';
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import { DAILY, ERROR_MESSAGE, MONTHLY, QUARTERLY, WEEKLY, YEARLY } from './constant';
import { Archive } from './para/Archive';
import { Area } from './para/Area';
import { Project } from './para/Project';
import { Resource } from './para/Resource';
import { Bullet } from './periodic/Bullet';
import { DailyRecord } from './periodic/DailyRecord';
import { Date as PeriodicDate } from './periodic/Date';
import { File } from './periodic/File';
import { Task } from './periodic/Task';
import { LogLevel, type PluginSettings } from './type';
import { createPeriodicFile, logMessage, openOfficialSite, renderError } from './util';
import { CREATE_NOTE, CreateNoteView } from './view/CreateNote';
import { SettingTabView } from './view/SettingTab';
import { DEFAULT_SETTINGS } from './view/SettingTab';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh';
import type { Locale } from 'antd/es/locale';
import { getI18n } from './i18n';

import './index.less';

const localeMap: Record<string, Locale> = {
  en: enUS,
  'en-us': enUS,
  zh: zhCN,
  'zh-cn': zhCN,
};
const locale = window.localStorage.getItem('language') || 'en';

export default class LifeOS extends Plugin {
  settings: PluginSettings;
  project: Project;
  area: Area;
  resource: Resource;
  archive: Archive;
  task: Task;
  file: File;
  bullet: Bullet;
  date: PeriodicDate;
  dataview: DataviewApi;
  views: Record<string, (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext, folder?: string) => void>;
  dailyRecord: DailyRecord;
  timeout: NodeJS.Timeout;
  interval: NodeJS.Timer;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.registerEvent(
      this.app.metadataCache.on('dataview:index-ready' as 'changed', () => {
        this.dataview = getAPI(this.app);
      }),
    );

    if (!isPluginEnabled(app)) {
      logMessage(getI18n(locale)[`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`], LogLevel.error);
      return;
    }

    this.app = app;
    this.dataview = this.dataview ?? getAPI(app);
  }

  getDataviewAPI(): Promise<DataviewApi> {
    return new Promise((resolve) => {
      if (this.dataview) {
        resolve(this.dataview);
        return;
      }

      const eventRef = this.app.metadataCache.on('dataview:index-ready' as 'changed', () => {
        this.app.metadataCache.offref(eventRef);
        resolve(getAPI(this.app));
      });

      setTimeout(() => {
        resolve(getAPI(this.app));
      }, 15 * 1000);
    });
  }

  async onload() {
    await this.loadSettings();
    this.registerView(CREATE_NOTE, (leaf) => {
      return new CreateNoteView(leaf, this.settings, localeMap[locale]);
    });

    const i18n = getI18n(locale);
    const item = this.addRibbonIcon('file-plus', i18n.COMMAND_CREATE_NOTES, this.initCreateNoteView);
    setIcon(item, 'file-plus');

    this.addCommand({
      id: 'periodic-para-create-notes',
      name: i18n.COMMAND_CREATE_NOTES,
      callback: this.initCreateNoteView,
    });
    [DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map((periodType) => {
      this.addCommand({
        id: `periodic-para-create-${periodType.toLocaleLowerCase()}-note`,
        name: i18n[`COMMAND_CREATE_${periodType.toUpperCase()}_NOTE`],
        callback: () => {
          createPeriodicFile(dayjs(), periodType, this.settings, this.app);
        },
      });
    });
    this.addCommand({
      id: 'periodic-para-life-os-guide',
      name: i18n.COMMAND_LIFEOS_GUIDE,
      callback: () => openOfficialSite(locale),
    });
    this.loadHelpers();
    this.loadDailyRecord();
    this.loadGlobalHelpers();
    this.loadViews();
    this.addSettingTab(new SettingTabView(this.app, this.settings, this, localeMap[locale]));

    const handler = (source: keyof typeof this.views, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const view = source.trim() as keyof typeof this.views;
      const legacyView = `${view}ByTime` as keyof typeof this.views;

      if (!view) {
        return renderError(
          this.app,
          getI18n(locale)[`${ERROR_MESSAGE}NO_VIEW_PROVIDED`],
          el.createEl('div'),
          ctx.sourcePath,
        );
      }

      if (!Object.keys(this.views).includes(view) && !Object.keys(this.views).includes(legacyView)) {
        return renderError(
          this.app,
          `${getI18n(locale)[`${ERROR_MESSAGE}NO_VIEW_EXISTED`]}: ${view}`,
          el.createEl('div'),
          ctx.sourcePath,
        );
      }

      const callback = this.views[view] || this.views[legacyView];

      return callback(view, el, ctx);
    };
    this.registerMarkdownCodeBlockProcessor('LifeOS', handler);
    this.registerMarkdownCodeBlockProcessor('PeriodicPARA', handler); // for backward compatibility
  }
  loadDailyRecord() {
    if (this.settings.usePeriodicNotes && this.settings.useDailyRecord) {
      this.dailyRecord = new DailyRecord(this.app, this.settings, this.file, locale);
      this.addCommand({
        id: 'periodic-para-sync-daily-record',
        name: getI18n(locale).COMMAND_SYNC_DAILY_RECORDS,
        callback: this.dailyRecord.sync,
      });
      this.addCommand({
        id: 'periodic-para-force-sync-daily-record',
        name: getI18n(locale).COMMAND_FORCE_SYNC_DAILY_RECORDS,
        callback: this.dailyRecord.forceSync,
      });

      const DailyRecordItem = this.addRibbonIcon('refresh-ccw-dot', getI18n(locale).SYNC_DAILY_RECORDS, () =>
        this.dailyRecord.sync(),
      );
      setIcon(DailyRecordItem, 'refresh-ccw-dot');

      clearTimeout(this.timeout);
      clearInterval(this.interval);

      // sync on start
      this.timeout = setTimeout(() => this.dailyRecord.sync(), 15 * 1000);
      // sync every 0.5 hour
      this.interval = setInterval(() => this.dailyRecord.sync(), 0.5 * 60 * 60 * 1000);
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

  onunload() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(settings: PluginSettings) {
    await this.saveData(settings);
    this.settings = settings;
    this.loadHelpers();
    this.loadGlobalHelpers();
    this.loadViews();
    this.loadDailyRecord();
  }

  loadHelpers() {
    this.task = new Task(this.app, this.settings, this, locale);
    this.file = new File(this.app, this.settings, this, locale);
    this.date = new PeriodicDate(this.app, this.settings, this.file, locale);
    this.bullet = new Bullet(this.app, this.settings, this, locale);

    this.project = new Project(this.settings.projectsPath, this.app, this.settings, this.file, locale);
    this.area = new Area(this.settings.areasPath, this.app, this.settings, this.file, locale);
    this.resource = new Resource(this.settings.resourcesPath, this.app, this.settings, this.file, locale);
    this.archive = new Archive(this.settings.archivesPath, this.app, this.settings, this.file, locale);
  }

  loadGlobalHelpers() {
    const helpers = {
      Project: this.project,
      Area: this.area,
      Resource: this.resource,
      Archive: this.archive,
      Task: this.task,
      File: this.file,
      Bullet: this.bullet,
      Date: this.date,
    };

    (window as any).PeriodicPARA = helpers;
    (window as any).LifeOS = helpers;
  }

  initCreateNoteView = async () => {
    const leafs = this.app.workspace.getLeavesOfType(CREATE_NOTE);

    if (leafs.length > 0) {
      this.app.workspace.revealLeaf(leafs[0]);
      return;
    }

    let leaf: WorkspaceLeaf | null;
    if (Platform.isMobile) {
      leaf = this.app.workspace.getRightLeaf(false);
    } else {
      leaf = this.app.workspace.getLeftLeaf(false);
    }

    await leaf?.setViewState({ type: CREATE_NOTE, active: true });
  };
}
