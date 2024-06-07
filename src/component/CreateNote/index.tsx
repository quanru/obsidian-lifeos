import React, { useRef, useState } from 'react';
import { Notice, TFile } from 'obsidian';
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

import weekOfYear from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';
import { useDocumentEvent } from '../../hooks/useDocumentEvent';
import { SolarDay } from 'tyme4ts';

dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(updateLocale);

export const CreateNote = (props: { width: number }) => {
  const { app, settings: initialSettings, locale } = useApp() || {};
  const [settings, setSettings] = useState<PluginSettings | undefined>(
    initialSettings
  );
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
  const [existsDates, setExistsDates] = useState<(string | undefined)[]>(
    app?.vault
      .getAllLoadedFiles()
      .filter(
        (file) =>
          settings?.periodicNotesPath &&
          file.path.indexOf(settings?.periodicNotesPath) === 0 &&
          (file as { extension?: string }).extension === 'md'
      )
      .map((file) => (file as { basename?: string }).basename) || []
  );

  useDocumentEvent('settingUpdate', (event) => {
    setSettings(event.detail);
    setType(event.detail.usePeriodicNotes ? PERIODIC : PARA);
  });

  app?.vault.on('create', (file) => {
    if (file instanceof TFile) {
      setExistsDates([file.basename, ...existsDates]);
    }
  });
  app?.vault.on('delete', (file) => {
    if (file instanceof TFile) {
      setExistsDates(existsDates.filter((date) => date !== file.basename));
    }
  });
  app?.vault.on('rename', (file, oldPath) => {
    if (file instanceof TFile) {
      setExistsDates(
        [file.basename, ...existsDates].filter((date) => date !== oldPath)
      );
    }
  });

  dayjs.updateLocale(localeKey, {
    weekStart:
      settings?.weekStart === -1
        ? locale?.locale === 'zh-cn'
          ? 1
          : 0
        : settings?.weekStart,
  });

  const cellRender: (value: dayjs.Dayjs, picker: string) => JSX.Element = (
    value,
    picker
  ) => {
    let formattedDate: string;
    let badgeText: string;
    const locale = window.localStorage.getItem('language') || 'en';
    const date = dayjs(value.format()).locale(locale);
    let chineseCalendarText = '';
    let dayWorkStatus = '';

    switch (picker) {
      case 'date':
        if (settings?.useChineseCalendar) {
          const solar = SolarDay.fromYmd(
            date.year(),
            date.month() + 1,
            date.date()
          );
          const lunar = solar.getLunarDay();
          const [, lunarMonthDay] = lunar.toString().split('年');

          chineseCalendarText = lunarMonthDay.includes('月初一')
            ? lunarMonthDay.slice(0, 2)
            : lunarMonthDay.slice(2, 4);

          const holiday = solar.getLegalHoliday();
          dayWorkStatus =
            typeof holiday?.isWork !== 'function'
              ? ''
              : holiday?.isWork()
              ? '班'
              : '休';
          const term = solar.getTerm();
          if (
            term.getJulianDay().getSolarDay().toString() === solar.toString()
          ) {
            chineseCalendarText = term.getName();
          }

          const lunarFestivalName = lunar
            .getFestival()
            ?.toString()
            .split(' ')[1];
          chineseCalendarText = lunarFestivalName
            ? lunarFestivalName.slice(-3)
            : chineseCalendarText;

          const solarFestivalName = solar
            .getFestival()
            ?.toString()
            .split(' ')[1];
          chineseCalendarText = solarFestivalName
            ? solarFestivalName.slice(-3)
            : chineseCalendarText;
        }
        formattedDate = date.format('YYYY-MM-DD');
        badgeText = `${date.date()}`;
        break;
      case 'week':
        formattedDate = date.format('YYYY-[W]WW');
        badgeText = `${date.date()}`;
        break;
      case 'month':
        formattedDate = date.format('YYYY-MM');
        badgeText = `${date.format('MMM')}`;
        break;
      case 'quarter':
        formattedDate = date.format('YYYY-[Q]Q');
        badgeText = `Q${date.quarter()}`;
        break;
      case 'year':
        formattedDate = date.format('YYYY');
        badgeText = `${date.year()}`;
        break;
      default:
        formattedDate = date.format('YYYY-MM-DD');
        badgeText = `${date.date()}`;
    }

    const cell = (
      <>
        <span style={{ lineHeight: 'initial', display: 'block' }}>
          {badgeText}
        </span>
        {settings?.useChineseCalendar && (
          <>
            <span className="chinese-cal">{chineseCalendarText}</span>
            <p
              className={`label
                          ${dayWorkStatus === '休' ? 'holiday' : ''}
                          ${dayWorkStatus === '班' ? 'workday' : ''}
                        `}
            >
              {dayWorkStatus}
            </p>
          </>
        )}
      </>
    );

    if (existsDates.includes(formattedDate)) {
      if (picker !== 'week') {
        return (
          <div className="ant-picker-cell-inner">
            <div className="cell-container">
              <span className="dot">•</span>
              {cell}
            </div>
          </div>
        );
      }

      if (date.day() === 1) {
        return (
          <div className="ant-picker-cell-inner">
            <div className="cell-container">
              <span className="week-dot">•</span>
              <span style={{ lineHeight: 'initial' }}>{badgeText}</span>
            </div>
          </div>
        );
      }
    }
    return (
      <div className="ant-picker-cell-inner">
        <div className="cell-container">{cell}</div>
      </div>
    );
  };

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
    templateFile = settings.usePARAAdvanced ? settings[`${paraActiveTab.toLocaleLowerCase()}sTemplateFilePath`] || `${path}/Template.md` :`${path}/Template.md`;

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
                  settings,
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
                        cellRender={(value: dayjs.Dayjs, info: any) => {
                          return cellRender(value, picker);
                        }}
                        onSelect={(day) => {
                          createPeriodicFile(
                            day,
                            periodicActiveTab,
                            settings,
                            app,
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
