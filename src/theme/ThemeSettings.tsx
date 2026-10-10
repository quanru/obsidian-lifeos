import React from 'react';
import { Form, Switch } from 'antd';
import type { PluginSettings } from '../type';
import { themeSettingsMessages } from './messages';
import { getI18n } from '../i18n';
import { DEFAULT_SETTINGS } from '../view/SettingTab';
import { InlineAutoComplete } from '../component/InlineAutoComplete';
import { InlineSelect } from '../component/InlineSelect';
import { PROJECT, AREA, RESOURCE, ARCHIVE } from '../constant';

type Option = { label: string; value: string };
export function ThemeSettings({
  settings,
  locale,
  folders,
  files,
}: {
  settings: PluginSettings;
  locale: string;
  folders: Option[];
  files: Option[];
}) {
  const m = themeSettingsMessages(locale);
  const localeMap = getI18n(locale);
  return (
    <>
      <Form.Item name="useThemeNotes" label={m.enable} valuePropName="checked">
        <Switch />
      </Form.Item>
      {settings.useThemeNotes && (
        <>
          <Form.Item name="usePARANotes" label={m.para} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="useThemeFolderSync" label={m.sync} help={m.syncHelp} valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
      {settings.useThemeNotes && settings.usePARANotes && (
        <>
          <Form.Item name="projectsPath" label={localeMap.SETTING_PROJECTS_FOLDER}>
            <InlineAutoComplete options={folders} />
          </Form.Item>
          <Form.Item name="areasPath" label={localeMap.SETTING_AREAS_FOLDER}>
            <InlineAutoComplete options={folders} />
          </Form.Item>
          <Form.Item name="resourcesPath" label={localeMap.SETTING_RESOURCES_FOLDER}>
            <InlineAutoComplete options={folders} />
          </Form.Item>
          <Form.Item name="archivesPath" label={localeMap.SETTING_ARCHIVES_FOLDER}>
            <InlineAutoComplete options={folders} />
          </Form.Item>
          <Form.Item
            help={localeMap.SETTING_ADVANCED_SETTINGS_HELP}
            name="usePARAAdvanced"
            label={localeMap.SETTING_ADVANCED_SETTINGS}
          >
            <Switch />
          </Form.Item>
          {settings.usePARAAdvanced && (
            <>
              <Form.Item name="paraIndexFilename" label={localeMap.SETTING_INDEX_FILENAME}>
                <InlineSelect
                  options={[
                    {
                      label: localeMap.SETTING_INDEX_FILENAME_FOLDER,
                      value: 'folderName',
                    },
                    {
                      label: localeMap.SETTING_INDEX_FILENAME_README,
                      value: 'readme',
                    },
                  ]}
                />
              </Form.Item>
              {[
                [PROJECT, settings.projectsPath],
                [AREA, settings.areasPath],
                [RESOURCE, settings.resourcesPath],
                [ARCHIVE, settings.archivesPath],
              ].map(([name, path]) => {
                return (
                  <Form.Item
                    key={name}
                    name={`${name.toLocaleLowerCase()}sTemplateFilePath`}
                    label={`${localeMap[name]}${localeMap.SETTING_TEMPLATE}`}
                  >
                    <InlineAutoComplete options={files} placeholder={`${path}/Template.md`} />
                  </Form.Item>
                );
              })}
            </>
          )}
        </>
      )}
      {settings.useThemeNotes && !settings.usePARANotes && (
        <>
          <Form.Item name="themesPath" label={m.folder}>
            <InlineAutoComplete options={folders} placeholder={DEFAULT_SETTINGS.themesPath} />
          </Form.Item>
          <Form.Item name="useThemeAdvanced" label={m.advanced} valuePropName="checked">
            <Switch />
          </Form.Item>
          {settings.useThemeAdvanced && (
            <>
              <Form.Item name="themeIndexFilename" label={m.index}>
                <InlineSelect
                  options={[
                    { value: 'readme', label: localeMap.SETTING_INDEX_FILENAME_README },
                    { value: 'folderName', label: localeMap.SETTING_INDEX_FILENAME_FOLDER },
                  ]}
                />
              </Form.Item>
              <Form.Item name="themesTemplateFilePath" label={m.template}>
                <InlineAutoComplete options={files} placeholder={`${settings.themesPath}/Template.md`} />
              </Form.Item>
            </>
          )}
        </>
      )}
      {settings.useThemeNotes && (
        <Form.Item name="useThemeSearch" label={m.search} valuePropName="checked">
          <Switch />
        </Form.Item>
      )}
    </>
  );
}
