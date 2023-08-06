import * as React from 'react';
import { useState } from 'react';
import { useApp } from 'src/hooks/useApp';
import { TFile } from 'obsidian';
import {
  DatePicker,
  Radio,
  Tabs,
  Input,
  InputTag,
  Space,
} from '@arco-design/web-react';

import '@arco-design/web-react/es/DatePicker/style/index.js';
import '@arco-design/web-react/es/Radio/style/index.js';
import '@arco-design/web-react/es/Tabs/style/index.js';
import '@arco-design/web-react/es/Input/style/index.js';
import '@arco-design/web-react/es/InputTag/style/index.js';
import '@arco-design/web-react/es/Space/style/index.js';

const TabPane = Tabs.TabPane;

const { YearPicker, QuarterPicker, MonthPicker, WeekPicker } = DatePicker;

export const AddTemplate = () => {
  const { app, settings } = useApp() || {};
  const [projectName, setProjectName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [archiveName, setArchiveName] = useState('');
  const [type, setType] = useState('Periodic Notes');

  return (
    <>
      <h4>Template</h4>
      <form // TODO: 改成受控组件 https://arco.design/react/components/form#%E5%8F%97%E6%8E%A7%E8%A1%A8%E5%8D%95
        onSubmit={async (event) => {
          event.preventDefault();

          if (!app || !settings) {
            return;
          }

          // TODO: 设置模版文件地址
          const folder =
            app.vault.getRoot().path + `${settings.projectsPath}/${projectName}`;
          const file = folder + '/README.md';

          const templateTFile =
            app.vault.getAbstractFileByPath('模版/PARA/README.md');

          if (templateTFile instanceof TFile) {
            const templateContent = await app.vault.read(templateTFile);
            app.vault.createFolder(folder);
            app.vault.create(file, templateContent);
          }
        }}
      >
        <Radio.Group
          type="button"
          name="type"
          value={type}
          onChange={setType}
          style={{ marginBottom: 40 }}
          options={['Periodic Notes', 'PARA']}
        ></Radio.Group>
        {type === 'Periodic Notes' ? (
          <Tabs key="Periodic Notes" defaultActiveTab="daily">
            <TabPane key="daily" title="日记">
              <DatePicker style={{ width: 200 }} />
            </TabPane>
            <TabPane key="weekly" title="周记">
              <WeekPicker style={{ width: 200 }} />
            </TabPane>
            <TabPane key="monthly" title="月记">
              <MonthPicker style={{ width: 200 }} />
            </TabPane>
            <TabPane key="quarterly" title="季记">
              <QuarterPicker style={{ width: 200 }} />
            </TabPane>
            <TabPane key="yearly" title="年记">
              <YearPicker style={{ width: 200 }} />
            </TabPane>
          </Tabs>
        ) : (
          <Tabs key="PARA" defaultActiveTab="project">
            <TabPane key="project" title="项目">
              <Space direction="vertical">
                <Space wrap>
                  <Input
                    value={projectName}
                    type="text"
                    id="projectName"
                    style={{ width: 350 }}
                    allowClear
                    placeholder="Please Enter Project Name"
                    onChange={(value: string) => setProjectName(value)}
                  />
                </Space>
                <InputTag
                  allowClear
                  placeholder="Please input tags"
                  style={{ maxWidth: 350, marginRight: 20 }}
                />
              </Space>
            </TabPane>
            <TabPane key="area" title="领域">
              <Space direction="vertical">
                <Space wrap>
                  <Input
                    value={areaName}
                    type="text"
                    id="areaName"
                    style={{ width: 350 }}
                    allowClear
                    placeholder="Please Enter Area Name"
                    onChange={(value: string) => setProjectName(value)}
                  />
                </Space>
                <InputTag
                  allowClear
                  placeholder="Please input tags"
                  style={{ maxWidth: 350, marginRight: 20 }}
                />
              </Space>
            </TabPane>
            <TabPane key="resource" title="资源">
              <Space direction="vertical">
                <Space wrap>
                  <Input
                    value={resourceName}
                    type="text"
                    id="resourceName"
                    style={{ width: 350 }}
                    allowClear
                    placeholder="Please Enter Resource Name"
                    onChange={(value: string) => setResourceName(value)}
                  />
                </Space>
                <InputTag
                  allowClear
                  placeholder="Please input tags"
                  style={{ maxWidth: 350, marginRight: 20 }}
                />
              </Space>
            </TabPane>
            <TabPane key="archive" title="存档">
              <Space direction="vertical">
                <Space wrap>
                  <Input
                    value={archiveName}
                    type="text"
                    id="archiveName"
                    style={{ width: 350 }}
                    allowClear
                    placeholder="Please Enter Archive Name"
                    onChange={(value: string) => setArchiveName(value)}
                  />
                </Space>
                <InputTag
                  allowClear
                  placeholder="Please input tags"
                  style={{ maxWidth: 350, marginRight: 20 }}
                />
              </Space>
            </TabPane>
          </Tabs>
        )}
        <button type="submit">Add</button>
      </form>
    </>
  );
};
