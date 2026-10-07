import { Button, Typography } from 'antd';
import { type App, Notice, TFile } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';
import { getFeatureI18n } from '../feature-i18n';
import type { PluginSettings } from '../type';
import { ThemePicker } from './ThemePicker';
import { defaultThemePaths } from './defaults';
import { openCaptureHotkeys } from './hotkeys';
import { captureSettingsMessages } from './settings-messages';
import { captureThemes } from './theme-catalog';
import type { CaptureTheme } from './theme-model';

export function CaptureSettings({
  app,
  settings,
  locale,
  onChange,
}: {
  app: App;
  settings: PluginSettings;
  locale: string;
  onChange: (paths: string[]) => void;
}) {
  const m = captureSettingsMessages(locale);
  const t = getFeatureI18n(locale);
  const [themes, setThemes] = useState<CaptureTheme[]>([]);
  const [failed, setFailed] = useState(false);
  const picker = useRef<ThemePicker>();
  const latest = useRef(settings);
  latest.current = settings;
  const paths = defaultThemePaths(settings.quickCaptureDefaultThemes);
  useEffect(() => {
    let active = true;
    const load = () =>
      void captureThemes(app, latest.current)
        .then((items) => {
          if (active) {
            setThemes(items);
            setFailed(false);
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    load();
    const refs = ['create', 'modify', 'delete', 'rename'].map((event) => app.vault.on(event as 'modify', load));
    return () => {
      active = false;
      refs.forEach((ref) => app.vault.offref(ref));
    };
  }, [
    app,
    settings.usePARANotes,
    settings.projectsPath,
    settings.areasPath,
    settings.resourcesPath,
    settings.archivesPath,
    settings.paraIndexFilename,
    settings.projectsTemplateFilePath,
    settings.areasTemplateFilePath,
    settings.resourcesTemplateFilePath,
    settings.archivesTemplateFilePath,
  ]);
  useEffect(() => () => picker.current?.close(), []);
  const choose = () => {
    picker.current?.close();
    picker.current = new ThemePicker(
      app,
      latest.current,
      locale,
      () => '',
      async () => false,
      async (path) => {
        const file = app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error('missing');
        await app.workspace.getLeaf('tab').openFile(file);
      },
      {
        title: m.defaults,
        read: () => defaultThemePaths(latest.current.quickCaptureDefaultThemes),
        apply: async (selected) => {
          onChange(selected);
          return true;
        },
      },
    );
    picker.current.open();
  };
  const hotkeys = (command: string) => {
    if (!openCaptureHotkeys(app, command)) new Notice(m.hotkeysHelp);
  };
  const missing = paths.filter((path) => !themes.some((theme) => theme.path === path));
  return (
    <div className="lifeos-capture-settings">
      <Typography.Title level={4}>{m.title}</Typography.Title>
      <Typography.Paragraph>{m.hotkeysHelp}</Typography.Paragraph>
      <div className="lifeos-capture-settings-actions">
        <Button onClick={() => hotkeys(t.quickRecordCommand)}>{m.recordHotkey}</Button>
        <Button onClick={() => hotkeys(t.quickTaskCommand)}>{m.taskHotkey}</Button>
      </div>
      <Typography.Title level={5}>{m.defaults}</Typography.Title>
      <Typography.Paragraph>{m.defaultsHelp}</Typography.Paragraph>
      <div className="lifeos-capture-default-summary" aria-live="polite">
        {paths.length ? (
          <ul>
            {paths.map((path) => (
              <li key={path}>{themes.find((theme) => theme.path === path)?.name ?? path}</li>
            ))}
          </ul>
        ) : (
          m.none
        )}
        {failed ? <p>{m.failed}</p> : missing.length > 0 && <p>{m.missing}</p>}
        {!settings.usePARANotes && <p>{m.paraOff}</p>}
      </div>
      <div className="lifeos-capture-settings-actions">
        <Button onClick={choose} disabled={!settings.usePARANotes}>
          {m.choose}
        </Button>
        <Button onClick={() => onChange([])} disabled={!paths.length}>
          {m.clear}
        </Button>
      </div>
    </div>
  );
}
