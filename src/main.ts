import { Platform, Plugin, TFile, setIcon } from 'obsidian';
import type { App, MarkdownPostProcessorContext, Menu, PluginManifest, TAbstractFile, WorkspaceLeaf } from 'obsidian';
import { type DataviewApi, getAPI, isPluginEnabled } from 'obsidian-dataview';

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
import 'dayjs/locale/ar';
import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/ja';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-tw';
import type { Locale } from 'antd/es/locale';
import { getAntdLocale, getDayjsLocale, getI18n, getLocale } from './i18n';

import './index.less';

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
  dailyRecordRibbonItem?: HTMLElement;
  locale: Locale;
  i18n: Record<string, string>;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.registerEvent(
      this.app.metadataCache.on('dataview:index-ready' as 'changed', () => {
        this.dataview = getAPI(this.app);
      }),
    );

    if (!isPluginEnabled(app)) {
      logMessage(getI18n(getLocale())[`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`], LogLevel.error);
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
      return new CreateNoteView(leaf, this.settings, this.locale, this);
    });

    const item = this.addRibbonIcon('file-plus', this.i18n.COMMAND_CREATE_NOTES, this.initCreateNoteView);
    setIcon(item, 'file-plus');

    this.addCommand({
      id: 'periodic-para-create-notes',
      name: this.i18n.COMMAND_CREATE_NOTES,
      callback: this.initCreateNoteView,
    });
    [DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map((periodType) => {
      this.addCommand({
        id: `periodic-para-create-${periodType.toLocaleLowerCase()}-note`,
        name: this.i18n[`COMMAND_CREATE_${periodType.toUpperCase()}_NOTE`],
        callback: () => {
          createPeriodicFile(dayjs(), periodType, this.settings, this.app, false, this.getCurrentLocaleKey());
        },
      });
    });
    this.addCommand({
      id: 'periodic-para-life-os-guide',
      name: this.i18n.COMMAND_LIFEOS_GUIDE,
      callback: () => openOfficialSite(this.getCurrentLocaleKey()),
    });
    this.loadHelpers();
    this.loadGlobalHelpers();
    this.loadViews();

    try {
      this.registerMarkdownCodeBlockProcessor('LifeOS', this.markdownCodeBlockProcessor);
      this.registerMarkdownCodeBlockProcessor('PeriodicPARA', this.markdownCodeBlockProcessor); // for backward compatibility
    } catch (error) {
      logMessage(error, LogLevel.error);
      return;
    }
    this.loadDailyRecord();
    this.registerFileMenu();
    this.addSettingTab(new SettingTabView(this.app, this.settings, this, this.locale));
  }
  registerFileMenu() {
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
        if (!this.settings.usePARANotes) return;
        if (file instanceof TFile) return;

        const paraFolders = [
          this.settings.projectsPath,
          this.settings.areasPath,
          this.settings.resourcesPath,
          this.settings.archivesPath,
        ];

        const parentPath = file.parent?.path;
        if (!parentPath || !paraFolders.includes(parentPath)) return;

        const targetFolders = paraFolders.filter((f) => f !== parentPath);

        targetFolders.forEach((targetFolder) => {
          menu.addItem((item) => {
            const i18n = getI18n(this.getCurrentLocaleKey());
            item
              .setSection('lifeos')
              .setIcon('folder-tree')
              .setTitle(`${i18n.MOVE_TO} "${targetFolder}"`)
              .onClick(() => {
                this.app.fileManager.renameFile(file, `${targetFolder}/${file.name}`);
              });
          });
        });
      }),
    );
  }

  loadDailyRecord() {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
    this.dailyRecordRibbonItem?.remove();
    this.dailyRecordRibbonItem = undefined;

    if (this.settings.usePeriodicNotes && this.settings.useDailyRecord) {
      const localeKey = this.getCurrentLocaleKey();

      this.dailyRecord = new DailyRecord(this.app, this.settings, this.file, localeKey);
      this.addCommand({
        id: 'periodic-para-sync-daily-record',
        name: getI18n(localeKey).COMMAND_SYNC_DAILY_RECORDS,
        callback: this.dailyRecord.sync,
      });
      this.addCommand({
        id: 'periodic-para-force-sync-daily-record',
        name: getI18n(localeKey).COMMAND_FORCE_SYNC_DAILY_RECORDS,
        callback: this.dailyRecord.forceSync,
      });

      this.dailyRecordRibbonItem = this.addRibbonIcon(
        'refresh-ccw-dot',
        getI18n(localeKey).COMMAND_SYNC_DAILY_RECORDS,
        () => this.dailyRecord.sync(),
      );
      setIcon(this.dailyRecordRibbonItem, 'refresh-ccw-dot');

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
      BulletRecordListByTime: this.bullet.listByTime,
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

  markdownCodeBlockProcessor = (
    source: keyof typeof this.views,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ) => {
    const view = source.trim() as keyof typeof this.views;
    const legacyView = `${view}ByTime` as keyof typeof this.views;
    const localeKey = this.getCurrentLocaleKey();

    if (!view) {
      return renderError(
        this.app,
        getI18n(localeKey)[`${ERROR_MESSAGE}NO_VIEW_PROVIDED`],
        el.createEl('div'),
        ctx.sourcePath,
      );
    }

    if (!Object.keys(this.views).includes(view) && !Object.keys(this.views).includes(legacyView)) {
      return renderError(
        this.app,
        `${getI18n(localeKey)[`${ERROR_MESSAGE}NO_VIEW_EXISTED`]}: ${view}`,
        el.createEl('div'),
        ctx.sourcePath,
      );
    }

    const callback = this.views[view] || this.views[legacyView];

    return callback(view, el, ctx);
  };

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.syncLocale(this.settings.locale);
  }

  async saveSettings(settings: PluginSettings) {
    await this.saveData(settings);
    this.settings = settings;
    this.syncLocale(settings.locale);
    this.loadHelpers();
    this.loadGlobalHelpers();
    this.loadViews();
    this.loadDailyRecord();
  }

  loadHelpers() {
    const localeKey = this.getCurrentLocaleKey();

    this.task = new Task(this.app, this.settings, this, localeKey);
    this.file = new File(this.app, this.settings, this, localeKey);
    this.date = new PeriodicDate(this.app, this.settings, this.file, localeKey);
    this.bullet = new Bullet(this.app, this.settings, this, localeKey);

    this.project = new Project(this.settings.projectsPath, this.app, this.settings, this.file, localeKey);
    this.area = new Area(this.settings.areasPath, this.app, this.settings, this.file, localeKey);
    this.resource = new Resource(this.settings.resourcesPath, this.app, this.settings, this.file, localeKey);
    this.archive = new Archive(this.settings.archivesPath, this.app, this.settings, this.file, localeKey);
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

  private syncLocale(localeOverride?: string) {
    const effectiveLocale = localeOverride || getLocale();
    this.i18n = getI18n(effectiveLocale);
    this.locale = getAntdLocale(effectiveLocale);
    dayjs.locale(getDayjsLocale(effectiveLocale));
  }

  getCurrentLocaleKey() {
    return this.settings?.locale || getLocale();
  }
}
