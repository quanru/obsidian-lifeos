import type { Locale } from 'antd/es/locale';
import { PluginSettingTab, debounce } from 'obsidian';
import type { App } from 'obsidian';
import React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { SettingTab } from '../component/SettingTab';
import { AppContext } from '../context';
import type LifeOS from '../main';
import type { PluginSettings } from '../type';

export const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
  usePeriodicAdvanced: false,
  periodicNotesTemplateFilePathYearly: '',
  periodicNotesTemplateFilePathQuarterly: '',
  periodicNotesTemplateFilePathMonthly: '',
  periodicNotesTemplateFilePathWeekly: '',
  periodicNotesTemplateFilePathDaily: '',
  projectsPath: '1. Projects',
  projectsTemplateFilePath: '',
  areasPath: '2. Areas',
  areasTemplateFilePath: '',
  resourcesPath: '3. Resources',
  resourcesTemplateFilePath: '',
  archivesPath: '4. Archives',
  archivesTemplateFilePath: '',
  projectListHeader: 'Project List',
  areaListHeader: 'First Things Dimension',
  habitHeader: 'Habit',
  dailyRecordHeader: 'Daily Record',
  dailyRecordAPI: '',
  dailyRecordToken: '',
  dailyRecordTag: '#daily-record',
  dailyRecordWarning: true,
  dailyRecordCreating: false,
  useDailyRecord: false,
  usePeriodicNotes: true,
  usePARANotes: true,
  usePARAAdvanced: false,
  paraIndexFilename: 'readme',
  weekStart: -1,
  useChineseCalendar: false,
};

export class SettingTabView extends PluginSettingTab {
  plugin: LifeOS;
  root: Root;
  settings: PluginSettings;
  locale: Locale;

  constructor(app: App, settings: PluginSettings, plugin: LifeOS, locale: Locale) {
    super(app, plugin);
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
  }

  display(): void {
    this.containerEl.empty();
    this.containerEl.addClass('periodic-para-setting-tab');
    this.root = createRoot(this.containerEl);

    // 保存设置的函数
    const saveSettings = debounce((newSettings: PluginSettings) => {
      this.settings = {
        ...this.settings,
        ...Object.entries(newSettings).reduce(
          (acc: Record<string, PluginSettings[keyof PluginSettings]>, [key, value]) => {
            acc[key] = typeof value === 'string' ? value.trim() : value;
            return acc;
          },
          {},
        ),
      };
      this.plugin.saveSettings(this.settings);
      const event = new CustomEvent('settingUpdate', {
        detail: this.settings,
      });
      document.dispatchEvent(event);
    }, 500);

    this.root.render(
      <AppContext.Provider
        value={{
          app: this.app,
          settings: this.settings,
          locale: this.locale,
        }}
      >
        <SettingTab settings={this.settings} saveSettings={saveSettings} />
      </AppContext.Provider>,
    );
  }

  async hide() {
    super.hide();
    this.root.unmount();
  }
}
