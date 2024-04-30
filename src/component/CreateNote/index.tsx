import React, { useRef, useState } from 'react';
import { Notice } from 'obsidian';
import { Form, Button, DatePicker, Radio, Tabs, Input, Tooltip } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
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
  TAG,
  FOLDER,
  INDEX,
  ERROR_MESSAGE,
} from '../../constant';
import { createFile, createPeriodicFile, openOfficialSite } from '../../util';
import type { PluginSettings } from '../../type';
import './index.less';
import { I18N_MAP } from '../../i18n';
import { useApp } from '../../hooks/useApp';
import { ConfigProvider } from '../ConfigProvider';
import { AutoComplete } from '../AutoComplete';

export const CreateNote = (props: { width: number }) => {
  const { app, settings, locale } = useApp() || {};
  const { width } = props;
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const defaultType = settings?.usePeriodicNotes ? PERIODIC : PARA;
  const [type, setType] = useState(defaultType);
  const [form] = Form.useForm();
  const today = dayjs(new Date());
  const localeKey = locale?.locale || 'en';
  const localeMap = I18N_MAP[localeKey] || I18N_MAP['en'];
  const SubmitButton = (
    <Form.Item
      style={{
        width: '100%',
        textAlign: 'end',
        position: 'relative',
        top: -18,
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
      return new Notice(localeMap[`${ERROR_MESSAGE}TAGS_MUST_INPUT`]);
    }

    folder = `${path}/${key}`;
    file = `${folder}/${INDEX}`;
    templateFile = `${path}/Template.md`;

    await createFile(app, {
      locale: localeKey,
      templateFile,
      folder,
      file,
      tag,
    });
    form.resetFields();
  };

  // all tags
  const tags = Object.entries(
    (app?.metadataCache as any).getTags() as Record<string, number>
  )
    .sort((a, b) => b[1] - a[1])
    .map(([tag, _]) => {
      return { value: tag, label: tag };
    });

  const singleClickRef = useRef<number | null>(null);
  const handleTagInput = (item: string) => {
    const itemTag = form.getFieldValue(`${item}Tag`).replace(/^#/, '');
    const itemFolder = itemTag.replace(/\//g, '-');
    const itemIndex =
      settings?.paraIndexFilename === 'readme'
        ? `${itemTag.split('/').reverse()[0]}.README`
        : `${itemFolder}`;

    form.setFieldValue(`${item}Folder`, itemFolder);
    form.setFieldValue(`${item}Index`, itemIndex ? `${itemIndex}.md` : '');
    form.validateFields([`${item}Folder`, `${item}Index`]);
  };

  return (
    <ConfigProvider
      components={{
        DatePicker: {
          cellWidth: width ? width / 7.5 : 45,
        },
      }}
    >
      <Tooltip title={localeMap.HELP}>
        <QuestionCircleOutlined
          onClick={() => openOfficialSite(localeKey)}
          style={{ position: 'fixed', right: 16 }}
        />
      </Tooltip>
      <Form
        requiredMark="optional"
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
        layout="vertical"
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
            onTabClick={(key) => {
              if (singleClickRef.current) {
                clearTimeout(singleClickRef.current);
                createPeriodicFile(
                  dayjs(new Date()),
                  key,
                  settings.periodicNotesPath,
                  app
                );
                singleClickRef.current = null;
              } else {
                singleClickRef.current = window.setTimeout(() => {
                  setPeriodicActiveTab(key);
                  singleClickRef.current = null;
                }, 200);
              }
            }}
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
                  label: (
                    <Tooltip
                      mouseEnterDelay={1}
                      title={`${
                        localeMap.QUICK_JUMP
                      }${label.toLocaleLowerCase()}`}
                    >
                      {label}
                    </Tooltip>
                  ),
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
                          tooltip={localeMap[`${TAG}ToolTip`]}
                          rules={[
                            {
                              required: true,
                              message: localeMap[`${TAG}Required`],
                            },
                            {
                              pattern: /^[^\s]*$/,
                              message: `Tag can't contain spaces`,
                            },
                          ]}
                        >
                          <AutoComplete
                            options={tags}
                            onSelect={() => handleTagInput(para)}
                          >
                            <Input
                              onChange={() => handleTagInput(para)}
                              allowClear
                              placeholder={
                                para === PROJECT ? 'PKM/LifeOS' : 'PKM' // 引导用户，项目一般属于某个领域
                              }
                            />
                          </AutoComplete>
                        </Form.Item>
                        <Form.Item
                          label={localeMap[FOLDER]}
                          name={`${para}Folder`}
                          tooltip={localeMap[`${FOLDER}ToolTip`]}
                          rules={[
                            {
                              required: true,
                              message: localeMap[`${FOLDER}Required`],
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
                          tooltip={localeMap[`${INDEX}ToolTip`]}
                          rules={[
                            {
                              required: true,
                              message: localeMap[`${INDEX}Required`],
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
