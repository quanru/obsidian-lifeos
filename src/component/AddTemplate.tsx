import * as React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from 'src/hooks/useApp';
import { Notice } from 'obsidian';
import {
  Form,
  Button,
  DatePicker,
  Radio,
  Tabs,
  Input,
  AutoComplete,
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
  PERIODIC,
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
  ERROR_MESSAGES,
} from '../constant';
import { createFile, createPeriodicFile, isDarkTheme } from '../util';
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
  const { app, settings, width } = useApp() || {};
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const defaultType = settings?.usePeriodicNotes ? PERIODIC : PARA;
  const [isDark, setDark] = useState(isDarkTheme());
  const [type, setType] = useState(defaultType);
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

  const createPARAFile = async (values: any) => {
    if (!app || !settings) {
      return;
    }

    let templateFile = '';
    let folder = '';
    let file = '';
    let tag = '';
    let README = '';
    const path =
      settings[
        `${paraActiveTab.toLocaleLowerCase()}sPath` as keyof PluginSettings
      ]; // settings.archivesPath;
    const key = values[`${paraActiveTab}Folder`]; // values.archiveFolder;
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

  useEffect(() => {
    const handleBodyClassChange = () => {
      setDark(isDarkTheme());
    };

    const observer = new MutationObserver(handleBodyClassChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // tags autocomplete
  const tags = Object.entries(
    (app?.metadataCache as any).getTags() as Record<string, number>
  )
    .sort((a, b) => b[1] - a[1])
    .map(([tag, _]) => {
      return { value: tag };
    });
  const [tagsOptions, setTagOptions] = useState<{ value: string }[]>(tags);
  const handleTagsSearch = (value: string) => {
    const filteredOptions = tags.filter((tag) =>
      tag.value.toLowerCase().includes(value.toLowerCase())
    );

    setTagOptions(filteredOptions);
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
        components: {
          DatePicker: {
            cellWidth: width ? width / 7.5 : 45,
            cellHeight: 30,
          },
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
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
            size="small"
            indicator={{ size: 0 }}
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
                        onSelect={(day) => {
                          createPeriodicFile(
                            day,
                            periodicActiveTab,
                            settings.periodicNotesPath,
                            app
                          );
                        }}
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
              size="small"
              indicator={{ size: 0 }}
              style={{ width: '100%' }}
              items={[PROJECT, AREA, RESOURCE, ARCHIVE].map((item) => {
                return {
                  label: item,
                  key: item,
                  children:
                    paraActiveTab === item ? (
                      <>
                        <Form.Item
                          labelCol={{ flex: '80px' }}
                          label="Tag"
                          name={`${item}Tag`}
                          rules={[
                            {
                              required: true,
                              message: 'Tag is required',
                            },
                            {
                              pattern: /^[^\s]*$/,
                              message: `Tag can't contain spaces`,
                            },
                          ]}
                        >
                          <AutoComplete
                            options={tagsOptions}
                            onSearch={handleTagsSearch}
                          >
                            <Input
                              onChange={() => {
                                const itemTag = form
                                  .getFieldValue(`${item}Tag`)
                                  .replace(/^#/, '');
                                const itemFolder = itemTag.replace(/\//g, '-');
                                const itemREADME = itemTag
                                  .split('/')
                                  .reverse()[0];

                                form.setFieldValue(`${item}Folder`, itemFolder);
                                form.setFieldValue(
                                  `${item}README`,
                                  itemREADME ? itemREADME + '.README.md' : ''
                                );
                                form.validateFields([
                                  `${item}Folder`,
                                  `${item}README`,
                                ]);
                              }}
                              allowClear
                              placeholder={`${item} Tag, eg: ${
                                item === PROJECT ? 'PKM/LifeOS' : 'PKM' // 引导用户，项目一般属于某个领域
                              }`}
                            />
                          </AutoComplete>
                        </Form.Item>
                        <Form.Item
                          labelCol={{ flex: '80px' }}
                          label="Folder"
                          name={`${item}Folder`}
                          rules={[
                            {
                              required: true,
                              message: 'Folder is required',
                            },
                          ]}
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
                          rules={[
                            {
                              required: true,
                              message: 'README is required',
                            },
                          ]}
                        >
                          <Input allowClear placeholder="LifeOS.README.md" />
                        </Form.Item>
                      </>
                    ) : null,
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
