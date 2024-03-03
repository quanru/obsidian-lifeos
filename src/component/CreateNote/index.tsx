import * as React from 'react';
import { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useApp';
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
  LOCALE_MAP,
  TAG,
  FOLDER,
  INDEX,
} from '../../constant';
import { createFile, createPeriodicFile, isDarkTheme } from '../../util';
import type { PluginSettings } from '../../type';
import './index.less';

export const CreateNote = (props: { width: number }) => {
  const { app, settings, locale } = useApp() || {};
  const { width } = props;
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const defaultType = settings?.usePeriodicNotes ? PERIODIC : PARA;
  const [isDark, setDark] = useState(isDarkTheme());
  const [type, setType] = useState(defaultType);
  const [form] = Form.useForm();
  const today = dayjs(new Date());
  const localeMap =
    LOCALE_MAP[locale?.locale || 'en-us'] || LOCALE_MAP['en-us'];
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
    let INDEX = '';
    const path =
      settings[
        `${paraActiveTab.toLocaleLowerCase()}sPath` as keyof PluginSettings
      ]; // settings.archivesPath;
    const key = values[`${paraActiveTab}Folder`]; // values.archiveFolder;
    tag = values[`${paraActiveTab}Tag`]; // values.archiveTag;
    INDEX = values[`${paraActiveTab}Index`]; // values.archiveIndex;

    if (!tag) {
      return new Notice(ERROR_MESSAGES.TAGS_MUST_INPUT);
    }

    folder = `${path}/${key}`;
    file = `${folder}/${INDEX}`;
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
  const handleTagInput = (item: string) => {
    const itemTag = form.getFieldValue(`${item}Tag`).replace(/^#/, '');
    const itemFolder = itemTag.replace(/\//g, '-');
    const itemIndex = itemTag.split('/').reverse()[0];

    form.setFieldValue(`${item}Folder`, itemFolder);
    form.setFieldValue(
      `${item}Index`,
      itemIndex ? itemIndex + '.README.md' : ''
    );
    form.validateFields([`${item}Folder`, `${item}Index`]);
  };
  const computedStyle = getComputedStyle(
    document.querySelector('.app-container')!
  );
  const fontSize =
    parseInt(computedStyle?.getPropertyValue('--nav-item-size')) || 13;

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontSize: fontSize,
          colorPrimary: reduceCSSCalc(
            getComputedStyle(document.body).getPropertyValue(
              '--interactive-accent'
            )
          ),
        },
        components: {
          DatePicker: {
            cellWidth: width ? width / 7.5 : 45,
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
            size="small"
            style={{
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Radio.Button value={PERIODIC}>{localeMap[PERIODIC]}</Radio.Button>
            <Radio.Button value={PARA}>{localeMap[PARA]}</Radio.Button>
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
                const label = localeMap[periodic];

                return {
                  label,
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
              items={[PROJECT, AREA, RESOURCE, ARCHIVE].map((para) => {
                const label = localeMap[para];

                return {
                  label,
                  key: para,
                  children:
                    paraActiveTab === para ? (
                      <>
                        <Form.Item
                          label={localeMap[TAG]}
                          name={`${para}Tag`}
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
                            onSelect={() => handleTagInput(para)}
                          >
                            <Input
                              onChange={() => handleTagInput(para)}
                              allowClear
                              placeholder={`${para} Tag, eg: ${
                                para === PROJECT ? 'PKM/LifeOS' : 'PKM' // 引导用户，项目一般属于某个领域
                              }`}
                            />
                          </AutoComplete>
                        </Form.Item>
                        <Form.Item
                          label={localeMap[FOLDER]}
                          name={`${para}Folder`}
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
                          label={localeMap[INDEX]}
                          name={`${para}Index`}
                          rules={[
                            {
                              required: true,
                              message: 'Index is required',
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
