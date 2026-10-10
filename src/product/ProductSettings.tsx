import { themeSettingsMessages } from '../theme/messages';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CompassOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import type { App } from 'obsidian';
import React from 'react';
import { getI18n } from '../i18n';
import type { PluginSettings } from '../type';
import { productMessages } from './messages';
import './index.less';

export function ProductSettings({ app, settings, locale }: { app: App; settings: PluginSettings; locale: string }) {
  const m = productMessages(locale);
  const t = getI18n(locale);
  const language = locale.startsWith('zh') ? '/zh' : '';
  const comparison = `https://lifeos.md${language}/plugin/lifeos/pricing?source=lifeos-oss-settings`;
  const paths = [
    [t.SETTING_PERIODIC_NOTES_FOLDER, settings.periodicNotesPath],
    [t.SETTING_DAILY_RECORD_HEADER, settings.dailyRecordHeader],
    ...(settings.usePARANotes
      ? [
          [t.SETTING_PROJECTS_FOLDER, settings.projectsPath],
          [t.SETTING_AREAS_FOLDER, settings.areasPath],
          [t.SETTING_RESOURCES_FOLDER, settings.resourcesPath],
          [t.SETTING_ARCHIVES_FOLDER, settings.archivesPath],
        ]
      : [[themeSettingsMessages(locale).folder, settings.themesPath]]),
  ];
  const run = (id: string) => {
    const host = app as App & { commands: { executeCommandById(id: string): boolean }; setting: { close(): void } };
    host.setting.close();
    host.commands.executeCommandById(`periodic-para:${id}`);
  };
  return (
    <div className="lifeos-product-settings" dir={locale.startsWith('ar') ? 'rtl' : 'ltr'}>
      <header className="lifeos-product-heading">
        <h3>{m.freeTitle}</h3>
        <p>{m.freeBody}</p>
      </header>
      <div className="lifeos-product-shortcuts">
        <button type="button" onClick={() => run('periodic-para-open-today-records')}>
          <CalendarOutlined aria-hidden />
          <span>{m.today}</span>
        </button>
        <button type="button" onClick={() => run('periodic-para-quick-record')}>
          <EditOutlined aria-hidden />
          <span>{m.capture}</span>
        </button>
      </div>
      <section className="lifeos-product-pro">
        <div className="lifeos-product-pro-heading">
          <span className="lifeos-product-pro-icon">
            <CompassOutlined aria-hidden />
          </span>
          <h3>LifeOS Pro</h3>
        </div>
        <p>{m.proBody}</p>
        <p className="lifeos-product-caption">{m.independent}</p>
        <a className="lifeos-product-link" href={comparison} target="_blank" rel="noopener noreferrer">
          <span>{m.compare}</span>
          <ArrowRightOutlined aria-hidden />
        </a>
      </section>
      <details className="lifeos-product-handover">
        <summary>
          <FolderOpenOutlined aria-hidden />
          <span>{m.handover}</span>
          <DownOutlined className="lifeos-product-chevron" aria-hidden />
        </summary>
        <div className="lifeos-product-handover-body">
          <p>{m.handoverHelp}</p>
          <dl>
            {paths.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <code>{value || '—'}</code>
                </dd>
              </div>
            ))}
          </dl>
          <a
            className="lifeos-product-link"
            href="https://github.com/quanru/obsidian-lifeos/blob/main/docs/pro-handover.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{m.guide}</span>
            <ExportOutlined aria-hidden />
          </a>
        </div>
      </details>
    </div>
  );
}
