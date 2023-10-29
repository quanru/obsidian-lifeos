import axios from 'axios';
import { App, Notice, TFile, moment } from 'obsidian';
import type { File } from './File';
import type { PluginSettings, DailyRecordType, FetchError } from '../type';
import { ERROR_MESSAGES } from '../constant';

export class DailyRecord {
  app: App;
  settings: PluginSettings;
  file: File;
  limit: number;
  lastTime: string;
  offset: number;
  localKey: string;
  constructor(app: App, settings: PluginSettings, file: File) {
    this.app = app;
    this.file = file;
    this.settings = settings;
    this.limit = 50;
    this.offset = 0;
    this.localKey = `periodic-para-daily-record-last-time-${this.settings.dailyRecordToken}`;
    this.lastTime = window.localStorage.getItem(this.localKey) || '';

    if (!this.settings.dailyRecordAPI) {
      new Notice(ERROR_MESSAGES.NO_DAILY_RECORD_API);
      console.log(ERROR_MESSAGES.NO_DAILY_RECORD_API);
      return;
    }

    if (!this.settings.dailyRecordToken) {
      new Notice(ERROR_MESSAGES.NO_DAILY_RECORD_TOKEN);
      console.log(ERROR_MESSAGES.NO_DAILY_RECORD_TOKEN);
      return;
    }

    if (!this.settings.dailyRecordHeader) {
      new Notice(ERROR_MESSAGES.NO_DAILY_RECORD_HEADER);
      console.log(ERROR_MESSAGES.NO_DAILY_RECORD_HEADER);
      return;
    }

    new Notice('Start sync daily record');
    console.log('Start sync daily record');
  }

  async fetch() {
    try {
      const { data } = await axios.get<DailyRecordType[] | FetchError>(
        this.settings.dailyRecordAPI,
        {
          params: {
            limit: this.limit,
            offset: this.offset,
            rowStatus: 'NORMAL',
          },
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.settings.dailyRecordToken}`,
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
      new Notice(`${ERROR_MESSAGES.DAILY_RECORD_FETCH_FAILED}: ${error}`);
      console.log(`${ERROR_MESSAGES.DAILY_RECORD_FETCH_FAILED}: ${error}`);
      throw error;
    }
  }

  forceSync = async () => {
    this.lastTime = '';
    this.sync();
  };

  sync = async () => {
    this.offset = 0;
    this.insert();
  };

  insert = async () => {
    const title = `# ${this.settings.dailyRecordHeader}\n`;
    const dailyRecordByDay: Record<string, Record<string, string>> = {};
    const records = (await this.fetch()) || [];
    const timeStamp = records[0]?.createdAt
      ? moment(records[0]?.createdAt).unix()
      : records[0]?.createdTs;

    if (!records.length || timeStamp * 1000 < Number(this.lastTime)) {
      // 直到 record 返回为空，或者最新的一条记录的时间，晚于上一次同步时间
      new Notice('End sync daily record');
      console.log('End sync daily record');

      window.localStorage.setItem(this.localKey, Date.now().toString());

      return;
    }

    for (const record of records) {
      const { createdTs, createdAt, content } = record;
      const timeStamp = createdAt ? moment(createdAt).unix() : createdTs;
      const [day, time] = moment(timeStamp * 1000)
        .format('YYYY-MM-DD HH:mm')
        .split(' ');

      if (!content) {
        continue;
      }

      const [firstLine, ...otherLine] = content.split('\n');
      const isTask = /^- \[.*?\]/.test(firstLine); // 目前仅支持 task
      const targetFirstLine = // 将标签和时间戳加到第一行
        (isTask
          ? `- [ ] ${time} ${firstLine.replace(/^- \[.*?\]/, '')}`
          : `- ${time} ${firstLine}`) + ` #daily-record ^${timeStamp}`;
      const finalTargetContent =
        targetFirstLine +
        (otherLine?.length
          ? '\n' + otherLine.join('\n').replace(/[\n\s]*$/, '') // 增头去尾
          : '');

      if (dailyRecordByDay[day]) {
        dailyRecordByDay[day][timeStamp] = finalTargetContent;
      } else {
        dailyRecordByDay[day] = {
          [timeStamp]: finalTargetContent,
        };
      }
    }

    await Promise.all(
      Object.keys(dailyRecordByDay).map(async (today) => {
        const targetFile = this.file.get(
          today,
          '',
          this.settings.periodicNotesPath
        );

        if (!targetFile) {
          new Notice(`${ERROR_MESSAGES.NO_DAILY_FILE_EXIST} ${today}`);
          console.log(`${ERROR_MESSAGES.NO_DAILY_FILE_EXIST} ${today}`);
          throw new Error(`${ERROR_MESSAGES.NO_DAILY_FILE_EXIST} ${today}`);
        }

        const reg = new RegExp(`${title}([\\s\\S]*?)(?=##|$)`);
        if (targetFile instanceof TFile) {
          const originFileContent = await this.app.vault.read(targetFile);
          const regMatch = originFileContent.match(reg);

          if (!regMatch?.length || !regMatch?.index) {
            if (!this.settings.dailyRecordToken) {
              new Notice(
                'Current daily file will not insert daily record due to no daily record header'
              );
              console.log(
                'Current daily file will not insert daily record due to no daily record header'
              );
              return;
            }

            return;
          }

          const localRecordContent = regMatch[1]?.trim();
          const from = regMatch?.index + title.length;
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
    this.insert();
  };
}
