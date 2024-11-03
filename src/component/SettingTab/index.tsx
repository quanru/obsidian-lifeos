import { Divider, Form, Input, Select, Switch, Tabs, Typography } from 'antd';
import React, { useState, useEffect } from 'react';
import {
  ARCHIVE,
  AREA,
  DAILY,
  MONTHLY,
  PROJECT,
  QUARTERLY,
  RESOURCE,
  WEEKLY,
  YEARLY,
} from '../../constant';
import { useApp } from '../../hooks/useApp';
import type { PluginSettings } from '../../type';
import { DEFAULT_SETTINGS } from '../../view/SettingTab';
import { ConfigProvider } from '../ConfigProvider';
import './index.less';
import { getI18n } from '../../i18n';
import { AutoComplete } from '../AutoComplete';
import { TopBanner } from '../TopBanner';

export const SettingTab = (props: {
  settings: PluginSettings;
  saveSettings: (settings: PluginSettings) => void;
}) => {
  const { app, locale } = useApp() || {};
  const { settings: initialSettings, saveSettings } = props;
  const [settings, setSetting] = useState(initialSettings);
  const [form] = Form.useForm();
  const folders =
    app?.vault
      .getAllLoadedFiles()
      .filter(file => !(file as { extension?: string }).extension)
      .map(file => {
        return {
          label: file.path,
          value: file.path,
        };
      }) || [];
  const files =
    app?.vault
      .getAllLoadedFiles()
      .filter(file => (file as { extension?: string }).extension === 'md')
      .map(file => {
        return {
          label: file.path,
          value: file.path,
        };
      }) || [];

  useEffect(() => {
    setSetting(initialSettings);
  }, [initialSettings]);

  const localeKey = locale?.locale || 'en';
  const localeMap = getI18n(localeKey);

  return (
    <ConfigProvider>
      <TopBanner locale={localeKey} />
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={settings}
        onValuesChange={changedValues => {
          setSetting({ ...settings, ...changedValues });
          saveSettings(changedValues);
        }}
      >
        <Tabs
          defaultActiveKey="periodic"
          centered
          items={[
            {
              key: 'periodic',
              label: localeMap.SETTING_PERIODIC_NOTES,
              children: (
                <>
                  <Form.Item
                    name="usePeriodicNotes"
                    label={localeMap.SETTING_TURN_ON}
                  >
                    <Switch />
                  </Form.Item>

                  {settings.usePeriodicNotes && (
                    <>
                      <Form.Item
                        name="periodicNotesPath"
                        label={localeMap.SETTING_PERIODIC_NOTES_FOLDER}
                      >
                        <AutoComplete options={folders}>
                          <Input
                            placeholder={DEFAULT_SETTINGS.periodicNotesPath}
                          />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        help={localeMap.SETTING_HABIT_HEADER_HELP}
                        name="habitHeader"
                        label={localeMap.SETTING_HABIT_HEADER}
                      >
                        <Input placeholder={DEFAULT_SETTINGS.habitHeader} />
                      </Form.Item>
                      {settings.usePARANotes && (
                        <>
                          <Form.Item
                            help={localeMap.SETTING_PROJECT_LIST_HEADER_HELP}
                            name="projectListHeader"
                            label={localeMap.SETTING_PROJECT_LIST_HEADER}
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.projectListHeader}
                            />
                          </Form.Item>
                          <Form.Item
                            help={localeMap.SETTING_AREA_LIST_HEADER_HELP}
                            name="areaListHeader"
                            label={localeMap.SETTING_AREA_LIST_HEADER}
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.areaListHeader}
                            />
                          </Form.Item>
                        </>
                      )}
                      <Form.Item
                        help={localeMap.SETTING_WEEK_START_HELP}
                        name="weekStart"
                        label={localeMap.SETTING_WEEK_START}
                      >
                        <Select
                          options={[
                            {
                              value: -1,
                              label: `${localeMap.SETTING_WEEK_START_AUTO}${
                                locale?.locale === 'zh-cn'
                                  ? `(${localeMap.SETTING_WEEK_START_MONDAY})`
                                  : `(${localeMap.SETTING_WEEK_START_SUNDAY})`
                              }`,
                            },
                            {
                              value: 1,
                              label: localeMap.SETTING_WEEK_START_MONDAY,
                            },
                            {
                              value: 2,
                              label: localeMap.SETTING_WEEK_START_TUESDAY,
                            },
                            {
                              value: 3,
                              label: localeMap.SETTING_WEEK_START_WEDNESDAY,
                            },
                            {
                              value: 4,
                              label: localeMap.SETTING_WEEK_START_THURSDAY,
                            },
                            {
                              value: 5,
                              label: localeMap.SETTING_WEEK_START_FRIDAY,
                            },
                            {
                              value: 6,
                              label: localeMap.SETTING_WEEK_START_SATURDAY,
                            },
                            {
                              value: 0,
                              label: localeMap.SETTING_WEEK_START_SUNDAY,
                            },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        help={localeMap.SETTING_CHINESE_CALENDAR_HELP}
                        name="useChineseCalendar"
                        label={localeMap.SETTING_CHINESE_CALENDAR}
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        help={localeMap.SETTING_ADVANCED_SETTINGS_HELP}
                        name="usePeriodicAdvanced"
                        label={localeMap.SETTING_ADVANCED_SETTINGS}
                      >
                        <Switch />
                      </Form.Item>
                      {settings.usePeriodicAdvanced && (
                        <>
                          {[DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map(
                            item => {
                              return (
                                <Form.Item
                                  key={item}
                                  name={`periodicNotesTemplateFilePath${item}`}
                                  label={`${localeMap[item]}${localeMap.SETTING_TEMPLATE}`}
                                >
                                  <AutoComplete options={files}>
                                    <Input
                                      placeholder={`${settings.periodicNotesPath}/Templates/${item}.md`}
                                    />
                                  </AutoComplete>
                                </Form.Item>
                              );
                            },
                          )}
                        </>
                      )}
                      <Divider />

                      <Form.Item
                        help={
                          <>
                            {localeMap.SETTING_DAILY_RECORD_HELP}
                            <Typography.Link href="https://usememos.com">
                              {' usememos '}
                            </Typography.Link>
                          </>
                        }
                        name="useDailyRecord"
                        label={localeMap.SETTING_DAILY_RECORD}
                      >
                        <Switch />
                      </Form.Item>
                      {settings.useDailyRecord && (
                        <>
                          <Form.Item
                            help={localeMap.SETTING_DAILY_RECORD_HEADER_HELP}
                            name="dailyRecordHeader"
                            label={localeMap.SETTING_DAILY_RECORD_HEADER}
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.dailyRecordHeader}
                            />
                          </Form.Item>
                          <Form.Item
                            help={localeMap.SETTING_DAILY_RECORD_API_HELP}
                            name="dailyRecordAPI"
                            label={localeMap.SETTING_DAILY_RECORD_API}
                          >
                            <Input
                              placeholder={
                                DEFAULT_SETTINGS.dailyRecordAPI ||
                                'https://your-use-memos.com'
                              }
                            />
                          </Form.Item>
                          <Form.Item
                            help={
                              <>
                                {localeMap.SETTING_DAILY_RECORD_TOKEN_HELP}
                                <Typography.Link href="https://www.usememos.com/docs/security/access-tokens">
                                  {' token '}
                                </Typography.Link>
                              </>
                            }
                            name="dailyRecordToken"
                            label={localeMap.SETTING_DAILY_RECORD_TOKEN}
                          >
                            <Input.TextArea autoSize={{ minRows: 2 }} />
                          </Form.Item>
                          <Form.Item
                            help={localeMap.SETTING_DAILY_RECORD_CREATING_HELP}
                            name="dailyRecordCreating"
                            label={localeMap.SETTING_DAILY_RECORD_CREATING}
                          >
                            <Switch />
                          </Form.Item>
                          <Form.Item
                            help={localeMap.SETTING_DAILY_RECORD_WARNING_HELP}
                            name="dailyRecordWarning"
                            label={localeMap.SETTING_DAILY_RECORD_WARNING}
                          >
                            <Switch />
                          </Form.Item>
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'para',
              label: localeMap.SETTING_PARA_NOTES,
              children: (
                <>
                  <Form.Item
                    name="usePARANotes"
                    label={localeMap.SETTING_TURN_ON}
                  >
                    <Switch />
                  </Form.Item>

                  {settings.usePARANotes && (
                    <>
                      <Form.Item
                        name="projectsPath"
                        label={localeMap.SETTING_PROJECTS_FOLDER}
                      >
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        name="areasPath"
                        label={localeMap.SETTING_AREAS_FOLDER}
                      >
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        name="resourcesPath"
                        label={localeMap.SETTING_RESOURCES_FOLDER}
                      >
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        name="archivesPath"
                        label={localeMap.SETTING_ARCHIVES_FOLDER}
                      >
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
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
                          <Form.Item
                            name="paraIndexFilename"
                            label={localeMap.SETTING_INDEX_FILENAME}
                          >
                            <Select
                              options={[
                                {
                                  label:
                                    localeMap.SETTING_INDEX_FILENAME_FOLDER,
                                  value: 'folderName',
                                },
                                {
                                  label:
                                    localeMap.SETTING_INDEX_FILENAME_README,
                                  value: 'readme',
                                },
                              ]}
                            />
                          </Form.Item>
                          <>
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
                                  <AutoComplete options={files}>
                                    <Input
                                      placeholder={`${path}/Template.md`}
                                    />
                                  </AutoComplete>
                                </Form.Item>
                              );
                            })}
                          </>
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
          ]}
        />
      </Form>
    </ConfigProvider>
  );
};
