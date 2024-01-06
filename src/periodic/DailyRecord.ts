import axios, { Axios } from 'axios';
import { App, TFile, moment, normalizePath } from 'obsidian';
import type { File } from './File';
import {
  type PluginSettings,
  type DailyRecordType,
  type FetchError,
  type ResourceType,
  LogLevel,
} from '../type';
import { ERROR_MESSAGES } from '../constant';
import {
  formatDailyRecord,
  generateFileName,
  generateHeaderRegExp,
  logMessage,
} from 'src/util';

export class DailyRecord {
  app: App;
  settings: PluginSettings;
  file: File;
  limit: number;
  lastTime: string;
  offset: number;
  localKey: string;
  axios: Axios;
  constructor(app: App, settings: PluginSettings, file: File) {
    if (!settings.dailyRecordAPI) {
      logMessage(ERROR_MESSAGES.NO_DAILY_RECORD_API);
      return;
    }

    if (!settings.dailyRecordToken) {
      logMessage(ERROR_MESSAGES.NO_DAILY_RECORD_TOKEN);
      return;
    }

    if (!settings.dailyRecordHeader) {
      logMessage(ERROR_MESSAGES.NO_DAILY_RECORD_HEADER);
      return;
    }

    this.app = app;
    this.file = file;
    this.settings = settings;
    this.limit = 50;
    this.offset = 0;
    this.localKey = `periodic-para-daily-record-last-time-${this.settings.dailyRecordToken}`;
    this.lastTime = window.localStorage.getItem(this.localKey) || '';
    this.axios = axios.create({
      headers: {
        Authorization: `Bearer ${this.settings.dailyRecordToken}`,
        Accept: 'application/json',
      },
    });
  }

  async fetch() {
    try {
      const { data } = await this.axios.get<DailyRecordType[] | FetchError>(
        this.settings.dailyRecordAPI,
        {
          params: {
            limit: this.limit,
            offset: this.offset,
            rowStatus: 'NORMAL',
          },
        }
      );

      if (Array.isArray(data)) {
        return data;
      }

      throw new Error(
        data.message || data.msg || data.error || JSON.stringify(data)
      );
    } catch (error) {
      logMessage(
        `${ERROR_MESSAGES.DAILY_RECORD_FETCH_FAILED}: ${error}`,
        LogLevel.error
      );
    }
  }

  forceSync = async () => {
    this.lastTime = '';
    this.sync();
  };

  sync = async () => {
    logMessage('Start sync daily record');
    this.offset = 0;
    this.downloadResource();
    this.insertDailyRecord();
  };

  async downloadResource() {
    const { origin } = new URL(this.settings.dailyRecordAPI);

    try {
      const { data } = await this.axios.get<ResourceType[] | FetchError>(
        origin + '/api/v1/resource'
      );

      if (Array.isArray(data)) {
        await Promise.all(
          data.map(async (resource) => {
            const folder = `${this.settings.periodicNotesPath}/Attachments`;
            const resourcePath = normalizePath(
              `${folder}/${generateFileName(resource)}`
            );

            const isResourceExists = await this.app.vault.adapter.exists(
              resourcePath
            );

            if (isResourceExists) {
              return;
            }

            const { data } = await this.axios.get(
              `${origin}/o/r/${resource.id}`,
              {
                responseType: 'arraybuffer',
              }
            );

            if (!data) {
              return;
            }

            if (!this.app.vault.getAbstractFileByPath(folder)) {
              this.app.vault.createFolder(folder);
            }

            await this.app.vault.adapter.writeBinary(resourcePath, data);
          })
        );
        return data;
      }

      throw new Error(
        data.message || data.msg || data.error || JSON.stringify(data)
      );
    } catch (error) {
      if (error.response.status === 404) {
        return;
      }
      logMessage(
        `${ERROR_MESSAGES.RESOURCE_FETCH_FAILED}: ${error}`,
        LogLevel.error
      );
    }
  }

  insertDailyRecord = async () => {
    const header = this.settings.dailyRecordHeader;
    const dailyRecordByDay: Record<string, Record<string, string>> = {};
    const records = (await this.fetch()) || [];
    const mostRecentTimeStamp = records[0]?.createdAt
      ? moment(records[0]?.createdAt).unix()
      : records[0]?.createdTs;

    if (!records.length || mostRecentTimeStamp * 1000 < Number(this.lastTime)) {
      // 直到 record 返回为空，或者最新的一条记录的时间，晚于上一次同步时间
      logMessage('End sync daily record');

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
      Object.keys(dailyRecordByDay).map(async (today) => {
        const momentDay = moment(today);
        const link = `${momentDay.year()}/Daily/${String(
          momentDay.month() + 1
        ).padStart(2, '0')}/${momentDay.format('YYYY-MM-DD')}.md`;
        const targetFile = this.file.get(
          link,
          '',
          this.settings.periodicNotesPath
        );

        if (!targetFile) {
          logMessage(
            `${ERROR_MESSAGES.NO_DAILY_FILE_EXIST} ${today}`,
            LogLevel.error
          );
        }
        const reg = generateHeaderRegExp(header);

        if (targetFile instanceof TFile) {
          const originFileContent = await this.app.vault.read(targetFile);
          const regMatch = originFileContent.match(reg);

          if (!regMatch?.length || !regMatch?.index) {
            if (!this.settings.dailyRecordToken) {
              logMessage(
                'Current daily file will not insert daily record due to no daily record header'
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
                  'YYYY-MM-DD-HH:mm'
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
            .map((item) => item[1]);

          const finalRecordContent = localRecordWithoutTime
            .concat(sortedRecordList)
            .join('\n');
          const fileContent =
            prefix.trim() +
            `\n${finalRecordContent}\n\n` +
            suffix.trim() +
            '\n';

          await this.app.vault.modify(targetFile, fileContent);
        }
      })
    );

    this.offset = this.offset + this.limit;
    this.insertDailyRecord();
  };
}
