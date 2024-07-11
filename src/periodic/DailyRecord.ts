import axios, { type Axios } from 'axios';
import { type App, TFile, moment, normalizePath } from 'obsidian';
import semver from 'semver';
import { ERROR_MESSAGE, MESSAGE } from '../constant';
import { I18N_MAP } from '../i18n';
import {
  type DailyRecordResponseTypeV2,
  type DailyRecordType,
  type FetchError,
  LogLevel,
  type PluginSettings,
  type ResourceType,
  type ResourceTypeV2,
  type WorkspaceProfileType,
} from '../type';
import {
  formatDailyRecord,
  generateFileName,
  generateHeaderRegExp,
  logMessage,
  transformV2Record,
} from '../util';
import type { File } from './File';

export class DailyRecord {
  app: App;
  settings: PluginSettings;
  file: File;
  lastTime: string;
  pageSize: number;
  pageToken: string;
  pageOffset: number;
  localKey: string;
  locale: string;
  axios: Axios;
  memosVersion: string;
  constructor(app: App, settings: PluginSettings, file: File, locale: string) {
    if (!settings.dailyRecordAPI) {
      logMessage(I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_API`]);
      return;
    }

    if (!settings.dailyRecordToken) {
      logMessage(
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_TOKEN`],
      );
      return;
    }

    if (!settings.dailyRecordHeader) {
      logMessage(
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_HEADER`],
      );
      return;
    }

    const { origin: baseURL } = new URL(settings.dailyRecordAPI);

    this.app = app;
    this.file = file;
    this.settings = settings;
    this.pageSize = 50;
    this.pageOffset = 0;
    this.pageToken = '';
    this.localKey = `periodic-para-daily-record-last-time-${this.settings.dailyRecordToken}`;
    this.lastTime = window.localStorage.getItem(this.localKey) || '';
    this.locale = locale;
    this.axios = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.settings.dailyRecordToken}`,
      },
      timeout: 20 * 1000,
    });
  }

  async getMemosVersion() {
    const urls = ['/api/v1/workspace/profile', '/api/v2/workspace/profile'];

    for (const url of urls) {
      try {
        const { data } = await this.axios.get<WorkspaceProfileType>(url);
        const version = data.workspaceProfile?.version || data.version;
        this.memosVersion = semver.lt(version, '0.22.0') ? 'v1' : 'v2';
        return; // 成功获取版本后退出方法
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error.message || '');
      }
    }

    if (!this.memosVersion) {
      logMessage(
        `${
          I18N_MAP[this.locale][`${ERROR_MESSAGE}FAILED_GET_USEMEMOS_VERSION`]
        }`,
        LogLevel.error,
      );
    }
  }

  async fetchMemosList() {
    try {
      if (this.memosVersion === 'v1') {
        const { data } = await this.axios.get<DailyRecordType[] | FetchError>(
          '/api/v1/memo',
          {
            params: {
              limit: this.pageSize,
              offset: this.pageOffset,
              rowStatus: 'NORMAL',
            },
          },
        );

        if (Array.isArray(data)) {
          return data;
        }

        throw new Error(
          data.message || data.msg || data.error || JSON.stringify(data),
        );
      }
      const { data } = await this.axios.get<DailyRecordResponseTypeV2>(
        '/api/v1/memos',
        {
          params: {
            pageSize: this.pageSize,
            pageToken: this.pageToken,
            filter: 'row_status=="NORMAL"',
          },
        },
      );

      if (data.code === 1) {
        throw new Error(data.message);
      }

      this.pageToken = data.nextPageToken;

      return data.memos?.map(transformV2Record);
    } catch (error) {
      logMessage(
        `${I18N_MAP[this.locale][`${ERROR_MESSAGE}DAILY_RECORD_FETCH_FAILED`]}: ${error}`,
        LogLevel.error,
      );
    }
  }

  async fetchResourceList() {
    try {
      if (this.memosVersion === 'v1') {
        const { data } = await this.axios.get<ResourceType[] | FetchError>(
          '/api/v1/resource',
          {},
        );

        if (Array.isArray(data)) {
          return data;
        }

        throw new Error(
          data.message || data.msg || data.error || JSON.stringify(data),
        );
      }
      const { data } = await this.axios.get<ResourceTypeV2>(
        '/api/v1/resources',
        {},
      );

      if (data.code === 1) {
        throw new Error(data.message);
      }

      return data?.resources;
    } catch (error) {
      if (error.response.status === 404) {
        return;
      }
      logMessage(
        `${I18N_MAP[this.locale][`${ERROR_MESSAGE}RESOURCE_FETCH_FAILED`]}: ${error}`,
        LogLevel.error,
      );
    }
  }

  forceSync = async () => {
    this.lastTime = '';
    await this.sync();
  };

  sync = async () => {
    logMessage(I18N_MAP[this.locale][`${MESSAGE}START_SYNC_USEMEMOS`]);
    this.pageOffset = 0;
    this.pageToken = '';
    await this.getMemosVersion();
    await this.insertDailyRecord();
    await this.downloadResource();
  };

  async downloadResource() {
    const resourceList = (await this.fetchResourceList()) || [];

    await Promise.all(
      resourceList.map(async resource => {
        if (resource.externalLink) {
          return;
        }

        const folder = `${this.settings.periodicNotesPath}/Attachments`;
        const resourcePath = normalizePath(
          `${folder}/${generateFileName(resource)}`,
        );

        const isResourceExists =
          await this.app.vault.adapter.exists(resourcePath);

        if (isResourceExists) {
          return;
        }

        const { data } = await this.axios.get(
          this.memosVersion === 'v1'
            ? `/o/r/${resource.uid || resource.name || resource.id}`
            : `/file/${resource.name}/${resource.filename}`,
          {
            responseType: 'arraybuffer',
          },
        );

        if (!data) {
          return;
        }

        if (!this.app.vault.getAbstractFileByPath(folder)) {
          await this.app.vault.createFolder(folder);
        }

        await this.app.vault.adapter.writeBinary(resourcePath, data);
      }),
    );
  }

  insertDailyRecord = async () => {
    const header = this.settings.dailyRecordHeader;
    const dailyRecordByDay: Record<string, Record<string, string>> = {};
    const records = (await this.fetchMemosList()) || [];
    const mostRecentTimeStamp = records[0]?.createdAt
      ? moment(records[0]?.createdAt).unix()
      : records[0]?.createdTs;

    if (!records.length || mostRecentTimeStamp * 1000 < Number(this.lastTime)) {
      // 直到 record 返回为空，或者最新的一条记录的时间，晚于上一次同步时间
      logMessage(I18N_MAP[this.locale][`${MESSAGE}END_SYNC_USEMEMOS`]);

      window.localStorage.setItem(this.localKey, Date.now().toString());

      return;
    }

    for (const record of records) {
      if (!record.content && !record.resourceList?.length) {
        continue;
      }

      const [date, timeStamp, formattedRecord] = formatDailyRecord(record);

      if (dailyRecordByDay[date]) {
        dailyRecordByDay[date][timeStamp] = formattedRecord;
      } else {
        dailyRecordByDay[date] = {
          [timeStamp]: formattedRecord,
        };
      }
    }

    await Promise.all(
      Object.keys(dailyRecordByDay).map(async today => {
        const momentDay = moment(today);
        const link = `${momentDay.year()}/Daily/${String(
          momentDay.month() + 1,
        ).padStart(2, '0')}/${momentDay.format('YYYY-MM-DD')}.md`;
        const targetFile = this.file.get(
          link,
          '',
          this.settings.periodicNotesPath,
        );

        if (!targetFile && this.settings.dailyRecordWarning) {
          logMessage(
            `${I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_FILE_EXIST`]} ${today}`,
            LogLevel.error,
          );
        }
        const reg = generateHeaderRegExp(header);

        if (targetFile instanceof TFile) {
          const originFileContent = await this.app.vault.read(targetFile);
          const regMatch = originFileContent.match(reg);

          if (!regMatch?.length || !regMatch?.index) {
            if (!this.settings.dailyRecordToken) {
              logMessage(
                'Current daily file will not insert daily record due to no daily record header',
              );
              return;
            }

            return;
          }

          const localRecordContent = regMatch[2]?.trim();
          const from = regMatch?.index + regMatch[1].length + 1;
          const to = from + localRecordContent.length;
          const prefix = originFileContent.slice(0, from);
          const suffix = originFileContent.slice(to);
          const localRecordList = localRecordContent
            ? localRecordContent.split(/\n(?=- )/g)
            : [];
          const remoteRecordListWithTime: Record<string, string> = {};
          const localRecordListWithTime: Record<string, string> = {};
          const localRecordWithoutTime: string[] = [];

          for (const record of localRecordList) {
            const regMatch = record.match(/.*\^(\d{10})/);
            const createdTs = regMatch?.length ? regMatch[1]?.trim() : '';

            if (createdTs) {
              remoteRecordListWithTime[createdTs] = record;
            } else if (/^- (\[.*\] )?\d\d:\d\d/.test(record)) {
              // 本地有时间的记录
              const regMatch = record.match(/\d\d:\d\d/);

              if (regMatch) {
                const time = regMatch[0]?.trim();
                const timeStamp = moment(
                  `${today}-${time}`,
                  'YYYY-MM-DD-HH:mm',
                ).unix();

                if (localRecordListWithTime[timeStamp]) {
                  // 避免时间戳重复，导致相互覆盖
                  localRecordListWithTime[timeStamp + 1] = record;
                } else {
                  localRecordListWithTime[timeStamp] = record;
                }
              }
            } else {
              localRecordWithoutTime.push(record);
            }
          }

          const sortedRecordList = Object.entries({
            ...dailyRecordByDay[today],
            ...remoteRecordListWithTime,
            ...localRecordListWithTime,
          })
            .sort((a, b) => {
              const indexA = Number(a[0]);
              const indexB = Number(b[0]);
              return indexA - indexB;
            })
            .map(item => item[1]);

          const finalRecordContent = localRecordWithoutTime
            .concat(sortedRecordList)
            .join('\n');
          const fileContent = `${prefix.trim()}\n${finalRecordContent}\n\n${suffix.trim()}\n`;

          await this.app.vault.modify(targetFile, fileContent);
        }
      }),
    );

    if (this.memosVersion === 'v1') {
      this.pageOffset = this.pageOffset + this.pageSize;
    } else if (!this.pageToken) {
      // v2 没有下一页 pageToken 时
      logMessage(I18N_MAP[this.locale][`${MESSAGE}END_SYNC_USEMEMOS`]);

      window.localStorage.setItem(this.localKey, Date.now().toString());

      return;
    }

    await this.insertDailyRecord();
  };
}
