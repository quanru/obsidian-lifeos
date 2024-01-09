import * as React from 'react';
import { useState } from 'react';
import { useApp } from 'src/hooks/useApp';
import { Notice } from 'obsidian';
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
import dayjs, { Dayjs } from 'dayjs';
import {
  PARA,
  PROJECT,
  AREA,
  RESOURCE,
  ARCHIVE,
  PERIODIC,
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
  ERROR_MESSAGES,
} from '../constant';
import { createFile, isDarkTheme } from '../util';
import type { PluginSettings } from '../type';

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

export const AddTemplate = () => {
  const { app, settings } = useApp() || {};
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const [type, setType] = useState(PERIODIC);
  const [form] = Form.useForm();
  const today = dayjs(new Date());
  const SubmitButton = (
    <Form.Item
      style={{
        width: '100%',
        textAlign: 'end',
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

  const createPeriodicFile = async (d: Dayjs) => {
    const dates = dayjs(d.format()).locale(locale);

    if (!app || !settings) {
      return;
    }

    let templateFile = '';
    let folder = '';
    let file = '';

    const year = dates.year();
    let value;

    if (periodicActiveTab === DAILY) {
      folder = `${
        settings.periodicNotesPath
      }/${year}/${periodicActiveTab}/${String(dates.month() + 1).padStart(
        2,
        '0'
      )}`;
      value = dates.format('YYYY-MM-DD');
    } else if (periodicActiveTab === WEEKLY) {
      folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
      value = dates.format('gggg-[W]ww');
    } else if (periodicActiveTab === MONTHLY) {
      folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
      value = dates.format('YYYY-MM');
    } else if (periodicActiveTab === QUARTERLY) {
      folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
      value = dates.format('YYYY-[Q]Q');
    } else if (periodicActiveTab === YEARLY) {
      folder = `${settings.periodicNotesPath}/${year}`;
      value = year;
    }

    file = `${folder}/${value}.md`;
    templateFile = `${settings.periodicNotesPath}/Templates/${periodicActiveTab}.md`;

    await createFile(app, {
      templateFile,
      folder,
      file,
    });
  };

  const createPARAFile = async (values: any) => {
    if (!app || !settings) {
      return;
    }

    let templateFile = '';
    let folder = '';
    let file = '';
    let tag = '';
    let README = '';
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

    await createFile(app, {
      templateFile,
      folder,
      file,
      tag,
    });
  };

  return (
    <ConfigProvider
      locale={localeMap[locale]}
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
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
        }}
        initialValues={{
          [DAILY]: today,
          [WEEKLY]: today,
          [MONTHLY]: today,
          [QUARTERLY]: today,
          [YEARLY]: today,
        }}
        form={form}
        onFinish={createPARAFile}
      >
        {settings?.usePARANotes && settings?.usePeriodicNotes && (
          <Radio.Group
            name="type"
            buttonStyle="solid"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: '100%',
              textAlign: 'center',
              marginBottom: 5,
            }}
          >
            <Radio.Button value={PERIODIC}>{PERIODIC}</Radio.Button>
            <Radio.Button value={PARA}>{PARA}</Radio.Button>
          </Radio.Group>
        )}
        {type === PERIODIC && settings?.usePeriodicNotes && (
          <Tabs
            key={PERIODIC}
            activeKey={periodicActiveTab}
            onChange={setPeriodicActiveTab}
            centered
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
                    <Form.Item name={periodic}>
                      <DatePicker
                        onSelect={createPeriodicFile}
                        picker={picker}
                        showToday={false}
                        style={{ width: 200 }}
                        inputReadOnly
                        open
                        getPopupContainer={(triggerNode: any) =>
                          triggerNode.parentNode
                        }
                      />
                    </Form.Item>
                  ),
                };
              }
            )}
          ></Tabs>
        )}
        {type === PARA && settings?.usePARANotes && (
          <>
            <Tabs
              key="PARA"
              activeKey={paraActiveTab}
              onChange={setParaActiveTab}
              centered
              style={{ width: '100%' }}
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
                            const itemFolder = itemTag.replace(/\//g, '-');
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
