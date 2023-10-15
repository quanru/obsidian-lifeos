import * as React from 'react';
import { useState } from 'react';
import { useApp } from 'src/hooks/useApp';
import { Notice, TFile, moment } from 'obsidian';
import {
  Form,
  Button,
  DatePicker,
  Radio,
  Tabs,
  Input,
  ConfigProvider,
  theme,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import reduceCSSCalc from 'reduce-css-calc';
import dayjs from 'dayjs';
import {
  PARA,
  PROJECT,
  AREA,
  RESOURCE,
  ARCHIVE,
  PERIODIC_NOTES,
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
  ERROR_MESSAGES,
} from '../constant';
import { isDarkTheme } from '../util';
import type { PluginSettings } from '../type';

import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

const localeMap: Record<string, any> = {
  en: enUS,
  zh: zhCN,
};

export const AddTemplate = () => {
  const { app, settings } = useApp() || {};
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const [type, setType] = useState(PERIODIC_NOTES);
  const [form] = Form.useForm();
  const today = dayjs(new Date());
  const SubmitButton = (
    <Form.Item
      style={{
        display: 'flex',
        justifyContent: 'right',
        alignItems: 'center',
        paddingTop: 25,
        paddingRight: 25,
      }}
    >
      <Button
        htmlType="submit"
        type="primary"
        shape="circle"
        size="large"
        icon={<PlusOutlined />}
      ></Button>
    </Form.Item>
  );
  const createFile = async (values: any) => {
    if (!app || !settings) {
      return;
    }

    let templateFile = '';
    let folder;
    let file;
    let tag = '';
    let README = '';

    if (type === PARA) {
      let path;
      let key;

      path =
        settings[
          `${paraActiveTab.toLocaleLowerCase()}sPath` as keyof PluginSettings
        ]; // settings.archivesPath;
      key = values[`${paraActiveTab}Folder`]; // values.archiveFolder;
      tag = values[`${paraActiveTab}Tag`]; // values.archiveTag;
      README = values[`${paraActiveTab}README`]; // values.archiveREADME;

      if (!tag) {
        return new Notice(ERROR_MESSAGES.TAGS_MUST_INPUT);
      }

      folder = `${path}/${key}`;
      file = `${folder}/${README}`;
      templateFile = `${path}/Template.md`;
    } else if (type === PERIODIC_NOTES) {
      const key = periodicActiveTab;
      let year = values[key]['$y'];
      let value;

      if (periodicActiveTab === DAILY) {
        folder = `${
          settings.periodicNotesPath
        }/${year}/${periodicActiveTab}/${String(
          values[key].month() + 1
        ).padStart(2, '0')}`;
        value = values[key].format('YYYY-MM-DD');
      } else if (periodicActiveTab === WEEKLY) {
        folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
        value = values[key].format('gggg-[W]w');
      } else if (periodicActiveTab === MONTHLY) {
        folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
        value = values[key].format('YYYY-MM');
      } else if (periodicActiveTab === QUARTERLY) {
        folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
        value = values[key].format('YYYY-[Q]Q');
      } else if (periodicActiveTab === YEARLY) {
        folder = `${settings.periodicNotesPath}/${year}`;
        value = year;
      }

      file = `${folder}/${value}.md`;
      templateFile = `${settings.periodicNotesPath}/Templates/${periodicActiveTab}.md`;
    }

    const templateTFile = app.vault.getAbstractFileByPath(templateFile!);

    if (!templateTFile) {
      return new Notice(ERROR_MESSAGES.NO_TEMPLATE_EXIST + templateFile);
    }

    if (templateTFile instanceof TFile) {
      const templateContent = await app.vault.read(templateTFile);

      if (!folder || !file) {
        return;
      }

      let tFile = app.vault.getAbstractFileByPath(file);

      if (tFile && tFile instanceof TFile) {
        return await app.workspace.getLeaf().openFile(tFile);
      }

      if (!app.vault.getAbstractFileByPath(folder)) {
        app.vault.createFolder(folder);
      }

      const fileCreated = await app.vault.create(file, templateContent);

      await Promise.all([
        app.fileManager.processFrontMatter(fileCreated, (frontMatter) => {
          if (!tag) {
            return;
          }

          frontMatter.tags = frontMatter.tags || [];
          frontMatter.tags.push(tag);
        }),
        app.workspace.getLeaf().openFile(fileCreated),
      ]);
      form.resetFields();
    }
  };

  return (
    <ConfigProvider
      locale={localeMap[window.localStorage.getItem('language') || 'en']}
      theme={{
        token: {
          colorPrimary: reduceCSSCalc(
            getComputedStyle(document.body).getPropertyValue(
              '--interactive-accent'
            )
          ),
        },
        algorithm: isDarkTheme() ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Form
        style={{ maxWidth: 750 }}
        initialValues={{
          [DAILY]: today,
          [WEEKLY]: today,
          [MONTHLY]: today,
          [QUARTERLY]: today,
          [YEARLY]: today,
        }}
        form={form}
        onFinish={createFile}
      >
        <Radio.Group
          name="type"
          buttonStyle="solid"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ marginBottom: 40 }}
        >
          <Radio.Button value={PERIODIC_NOTES}>{PERIODIC_NOTES}</Radio.Button>
          <Radio.Button value={PARA}>{PARA}</Radio.Button>
        </Radio.Group>
        {type === PERIODIC_NOTES ? (
          <Tabs
            key={PERIODIC_NOTES}
            activeKey={periodicActiveTab}
            onChange={setPeriodicActiveTab}
            items={[DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map(
              (periodic) => {
                const pickerMap: Record<
                  string,
                  'date' | 'week' | 'month' | 'quarter' | 'year'
                > = {
                  [DAILY]: 'date',
                  [WEEKLY]: 'week',
                  [MONTHLY]: 'month',
                  [QUARTERLY]: 'quarter',
                  [YEARLY]: 'year',
                };
                const picker = pickerMap[periodic];

                return {
                  label: periodic,
                  key: periodic,
                  children: (
                    <>
                      <Form.Item name={periodic}>
                        <DatePicker
                          picker={picker}
                          showToday={false}
                          style={{ width: 200 }}
                          inputReadOnly
                          open
                          renderExtraFooter={() => SubmitButton}
                          getPopupContainer={(triggerNode: any) =>
                            triggerNode.parentNode
                          }
                        />
                      </Form.Item>
                    </>
                  ),
                };
              }
            )}
          ></Tabs>
        ) : (
          <>
            <Tabs
              key="PARA"
              activeKey={paraActiveTab}
              onChange={setParaActiveTab}
              items={[PROJECT, AREA, RESOURCE, ARCHIVE].map((item) => {
                return {
                  label: item,
                  key: item,
                  children: (
                    <>
                      <Form.Item
                        labelCol={{ flex: '80px' }}
                        label="Tag"
                        name={`${item}Tag`}
                      >
                        <Input
                          onChange={() => {
                            const itemTag = form
                              .getFieldValue(`${item}Tag`)
                              .replace(/^#/, '');
                            const itemFolder = itemTag.replace('/', '-');
                            const itemREADME = itemTag.split('/').reverse()[0];

                            form.setFieldValue(
                              `${item}README`,
                              (itemREADME ? itemREADME + '.' : '') + 'README.md'
                            );
                            form.setFieldValue(`${item}Folder`, itemFolder);
                          }}
                          allowClear
                          placeholder="PKM/LifeOS"
                        />
                      </Form.Item>
                      <Form.Item
                        labelCol={{ flex: '80px' }}
                        label="Folder"
                        name={`${item}Folder`}
                      >
                        <Input
                          type="text"
                          allowClear
                          placeholder="PKM-LifeOS"
                        />
                      </Form.Item>
                      <Form.Item
                        labelCol={{ flex: '80px' }}
                        label="README"
                        name={`${item}README`}
                      >
                        <Input allowClear placeholder="LifeOS.README.md" />
                      </Form.Item>
                    </>
                  ),
                };
              })}
            ></Tabs>
            {SubmitButton}
          </>
        )}
      </Form>
    </ConfigProvider>
  );
};
