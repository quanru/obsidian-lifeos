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
  InputTag,
} from '@arco-design/web-react';

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

import '@arco-design/web-react/es/Form/style/index.js';
import '@arco-design/web-react/es/Button/style/index.js';
import '@arco-design/web-react/es/DatePicker/style/index.js';
import '@arco-design/web-react/es/Radio/style/index.js';
import '@arco-design/web-react/es/Tabs/style/index.js';
import '@arco-design/web-react/es/Input/style/index.js';
import '@arco-design/web-react/es/InputTag/style/index.js';

const { TabPane } = Tabs;
const { YearPicker, QuarterPicker, MonthPicker, WeekPicker } = DatePicker;

export const AddTemplate = () => {
  const { app, settings } = useApp() || {};
  const [periodicActiveTab, setPeriodicActiveTab] = useState(DAILY);
  const [paraActiveTab, setParaActiveTab] = useState(PROJECT);
  const [type, setType] = useState(PERIODIC_NOTES);
  const [form] = Form.useForm();

  return (
    <>
      <Form
        style={{ maxWidth: 750 }}
        form={form}
        onSubmit={async (values) => {
          if (!app || !settings) {
            return;
          }

          let templateFile;
          let folder;
          let file;
          let tags: string[] = [];

          if (type === PARA) {
            let path;
            let key;

            if (paraActiveTab === PROJECT) {
              path = settings.projectsPath;
              key = values.projectName;
              tags = values.projectTags;
            } else if (paraActiveTab === AREA) {
              path = settings.areasPath;
              key = values.areaName;
              tags = values.areaTags;
            } else if (paraActiveTab === RESOURCE) {
              path = settings.resourcesPath;
              key = values.resourceName;
              tags = values.resourceTags;
            } else if (paraActiveTab === ARCHIVE) {
              path = settings.archivesPath;
              key = values.archiveName;
              tags = values.archiveTags;
            }

            if (!tags?.length) {
              return new Notice(ERROR_MESSAGES.TAGS_MUST_INPUT);
            }

            folder = app.vault.getRoot().path + `${path}/${key}`;
            file = `${folder}/README.md`;
            templateFile = `${path}/Template.md`;
          } else if (type === PERIODIC_NOTES) {
            const key = periodicActiveTab.toLowerCase();
            const value = values[key].format
              ? values[key].format('gggg-[W]w') // for WeekPicker bug https://github.com/arco-design/arco-design/issues/553#issuecomment-1049541725
              : values[key];
            const year = value.match(/(^\d\d\d\d)-?/)[1];

            if (periodicActiveTab === DAILY) {
              folder = `${
                settings.periodicNotesPath
              }/${year}/${periodicActiveTab}/${String(
                moment(values.daily).month() + 1
              ).padStart(2, '0')}`;
            } else if (
              periodicActiveTab === WEEKLY ||
              periodicActiveTab === MONTHLY ||
              periodicActiveTab === QUARTERLY
            ) {
              folder = `${settings.periodicNotesPath}/${year}/${periodicActiveTab}`;
            } else if (periodicActiveTab === YEARLY) {
              folder = `${settings.periodicNotesPath}/${year}`;
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

            if (app.vault.getAbstractFileByPath(file)) {
              return new Notice(ERROR_MESSAGES.FILE_ALREADY_EXIST + file);
            }

            if (!app.vault.getAbstractFileByPath(folder)) {
              app.vault.createFolder(folder);
            }

            const tFile = await app.vault.create(file, templateContent);

            await app.fileManager.processFrontMatter(tFile, (frontMatter) => {
              if (tags.length) {
                frontMatter.tags = frontMatter.tags || [];
                frontMatter.tags = tags.concat(frontMatter.tags);
              }
            });
            await app.workspace.getLeaf().openFile(tFile);
          }
        }}
      >
        <Radio.Group
          type="button"
          name="type"
          value={type}
          onChange={setType}
          style={{ marginBottom: 40 }}
          options={[PERIODIC_NOTES, PARA]}
        ></Radio.Group>
        {type === PERIODIC_NOTES ? (
          <Tabs
            key={PERIODIC_NOTES}
            activeTab={periodicActiveTab}
            onChange={setPeriodicActiveTab}
          >
            <TabPane key={DAILY} title={DAILY}>
              <Form.Item field="daily">
                <DatePicker
                  style={{ width: 200 }}
                />
              </Form.Item>
            </TabPane>
            <TabPane key={WEEKLY} title={WEEKLY}>
              <Form.Item
                getValueFromEvent={(_, current) => current}
                field="weekly"
              >
                <WeekPicker format="gggg-[W]w" style={{ width: 200 }} />
              </Form.Item>
            </TabPane>
            <TabPane key={MONTHLY} title={MONTHLY}>
              <Form.Item field="monthly">
                <MonthPicker style={{ width: 200 }} />
              </Form.Item>
            </TabPane>
            <TabPane key={QUARTERLY} title={QUARTERLY}>
              <Form.Item field="quarterly">
                <QuarterPicker style={{ width: 200 }} />
              </Form.Item>
            </TabPane>
            <TabPane key={YEARLY} title={YEARLY}>
              <Form.Item field="yearly">
                <YearPicker style={{ width: 200 }} />
              </Form.Item>
            </TabPane>
          </Tabs>
        ) : (
          <Tabs
            key="PARA"
            activeTab={paraActiveTab}
            onChange={setParaActiveTab}
          >
            <TabPane key={PROJECT} title={PROJECT}>
              <Form.Item field="projectName">
                <Input type="text" allowClear placeholder="Project Name" />
              </Form.Item>
              <Form.Item field="projectTags">
                <InputTag allowClear placeholder="Tags" />
              </Form.Item>
            </TabPane>
            <TabPane key={AREA} title={AREA}>
              <Form.Item field="areaName">
                <Input type="text" allowClear placeholder="Area Name" />
              </Form.Item>
              <Form.Item field="areaTags">
                <InputTag allowClear placeholder="Tags" />
              </Form.Item>
            </TabPane>
            <TabPane key={RESOURCE} title={RESOURCE}>
              <Form.Item field="resourceName">
                <Input type="text" allowClear placeholder="Resource Name" />
              </Form.Item>
              <Form.Item field="resourceTags">
                <InputTag allowClear placeholder="Tags" />
              </Form.Item>
            </TabPane>
            <TabPane key={ARCHIVE} title={ARCHIVE}>
              <Form.Item field="archiveName">
                <Input type="text" allowClear placeholder="Archive Name" />
              </Form.Item>
              <Form.Item field="archiveTags">
                <InputTag allowClear placeholder="Tags" />
              </Form.Item>
            </TabPane>
          </Tabs>
        )}
        <Form.Item>
          <Button htmlType="submit" type="primary" style={{ width: 200 }}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};
