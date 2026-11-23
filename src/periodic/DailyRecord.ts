import dayjs from 'dayjs';
import { type App, TFile, TFolder, moment, normalizePath } from 'obsidian';
import semver from 'semver';
import { DAILY, ERROR_MESSAGE, MESSAGE } from '../constant';
import { getI18n } from '../i18n';
import { customRequest, isMissingEndpoint } from '../request';
import {
  type AttachmentType,
  type DailyRecordResponseTypeV2,
  type DailyRecordType,
  type FetchError,
  type InstanceProfileType,
  LogLevel,
  type PluginSettings,
  type ResourceType,
  type ResourceTypeV2,
  type UserType,
  type WorkspaceProfileType,
} from '../type';
import {
  createPeriodicFile,
  formatDailyRecord,
  generateFileName,
  generateHeaderRegExp,
  joinVaultPath,
  logMessage,
  sleep,
  transformV2Record,
} from '../util';
import { withVaultLock } from '../vault-lock';
import type { File } from './File';
import * as memosIdentity from './memos-identity';

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
  baseURL: string;
  memosVersion: string;
  memosProfile: WorkspaceProfileType | InstanceProfileType;
  memosUserName: string;
  memosUserResourceName: string | null;
  memosUserId: number | null;
  private hasCreatedNewFile: boolean;
  private pendingSync: Promise<void> | null = null;

  constructor(app: App, settings: PluginSettings, file: File, locale: string) {
    if (!settings.dailyRecordAPI) {
      logMessage(getI18n(locale)[`${ERROR_MESSAGE}NO_DAILY_RECORD_API`]);
      return;
    }

    if (!settings.dailyRecordToken) {
      logMessage(getI18n(locale)[`${ERROR_MESSAGE}NO_DAILY_RECORD_TOKEN`]);
      return;
    }

    if (!settings.dailyRecordHeader) {
      logMessage(getI18n(locale)[`${ERROR_MESSAGE}NO_DAILY_RECORD_HEADER`]);
      return;
    }

    const endpoint = new URL(settings.dailyRecordAPI);
    // Some existing settings contain a pasted API endpoint rather than the instance URL.
    // Remove its known suffix without losing a reverse proxy's mount path.
    const mountPath = endpoint.pathname
      .replace(/\/+$/, '')
      .replace(/\/api(?:\/v[12])?(?:\/memos?|\/(?:workspace|instance)\/profile)?$/, '');
    this.baseURL = endpoint.origin + mountPath;

    this.app = app;
    this.file = file;
    this.settings = settings;
    this.pageSize = 50;
    this.pageOffset = 0;
    this.pageToken = '';
    this.localKey = `lifeos-daily-record-last-time-${this.settings.dailyRecordToken}`;
    this.lastTime = window.localStorage.getItem(this.localKey) || '';
    this.locale = locale;
    this.memosUserResourceName = null;
    this.memosUserId = null;
    this.hasCreatedNewFile = false;
  }

  private getMemosUserIdFromUser(user?: UserType | null) {
    if (!user) {
      return null;
    }

    if (typeof user.id === 'number') {
      return user.id;
    }

    if (typeof user.id === 'string' && /^\d+$/.test(user.id)) {
      const parsedUserId = Number.parseInt(user.id, 10);
      return Number.isNaN(parsedUserId) ? null : parsedUserId;
    }

    const matchedUserId = user.name?.match(/^users\/(\d+)$/);
    if (!matchedUserId?.[1]) {
      return null;
    }

    const parsedUserId = Number.parseInt(matchedUserId[1], 10);
    return Number.isNaN(parsedUserId) ? null : parsedUserId;
  }

  private getMemosUserResourceNameFromUser(user?: UserType | null) {
    if (!user) {
      return null;
    }

    if (memosIdentity.isMemosUserResourceName(user.name)) {
      return user.name;
    }

    if (typeof user.id === 'number' && Number.isInteger(user.id)) {
      return `users/${user.id}`;
    }

    if (typeof user.id === 'string' && /^\d+$/.test(user.id)) {
      return `users/${user.id}`;
    }

    if (user.username) {
      return `users/${user.username}`;
    }

    return null;
  }

  async getMemosUserName() {
    let endpoint: { url: string; method: 'GET' | 'POST' };

    if (this.memosVersion === 'modern') {
      endpoint = { url: '/api/auth/me', method: 'GET' };
    } else if (this.memosVersion === 'v2.6') {
      endpoint = { url: '/api/v1/auth/me', method: 'GET' };
    } else if (this.memosVersion === 'v2.5') {
      endpoint = { url: '/api/v1/auth/sessions/current', method: 'GET' };
    } else {
      endpoint = { url: '/api/v1/auth/status', method: 'POST' };
    }

    this.memosUserName = '';
    this.memosUserResourceName = null;
    this.memosUserId = null;

    try {
      const { json: data } = await customRequest<{ user?: UserType } | UserType>({
        url: `${this.baseURL}${endpoint.url}`,
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${this.settings.dailyRecordToken}`,
        },
      });

      const user = data && typeof data === 'object' && 'user' in data ? data.user : (data as UserType);
      this.memosUserName = user?.name || '';
      this.memosUserId = this.getMemosUserIdFromUser(user);
      this.memosUserResourceName =
        this.memosVersion === 'modern'
          ? memosIdentity.isMemosUserResourceName(user?.name)
            ? user.name
            : null
          : this.getMemosUserResourceNameFromUser(user);
    } catch (error) {
      // Never substitute the instance owner for a token rejected by the server.
      if (this.memosVersion === 'modern' || this.memosVersion === 'v2.6' || !isMissingEndpoint(error)) throw error;
      this.memosUserId = memosIdentity.getMemosUserIdFromOwner(this.memosProfile?.owner);
      this.memosUserResourceName = memosIdentity.getMemosUserResourceNameFromOwner(this.memosProfile?.owner);
    }

    if (['modern', 'v2.6'].includes(this.memosVersion) && !this.memosUserResourceName) {
      throw new Error('Failed to determine the authenticated Memos user');
    }
  }

  async getMemosVersion() {
    this.memosVersion = '';
    const profiles = [
      '/api/instance/profile',
      '/api/v1/instance/profile',
      '/api/v1/workspace/profile',
      '/api/v2/workspace/profile',
    ];

    for (const url of profiles) {
      let data: WorkspaceProfileType | InstanceProfileType;
      try {
        const response = await customRequest<WorkspaceProfileType | InstanceProfileType>({
          url: `${this.baseURL}${url}`,
          headers: {
            Authorization: `Bearer ${this.settings.dailyRecordToken}`,
          },
        });
        // Older Memos versions can return their SPA shell for an unknown API path.
        // Do not interpret a proxy's sign-in page or a broken JSON response as an absent route.
        const contentType = Object.entries(response.headers).find(
          ([name]) => name.toLowerCase() === 'content-type',
        )?.[1];
        if (
          response.status === 200 &&
          /^text\/html(?:\s*;|$)/i.test(contentType || '') &&
          (response.text.includes('<!-- memos.metadata.head -->') ||
            (/<title>memos<\/title>/i.test(response.text) &&
              response.text.includes('site.webmanifest') &&
              response.text.includes('id="root"')))
        ) {
          continue;
        }
        data = response.json;
      } catch (error) {
        if (!isMissingEndpoint(error)) throw error;
        continue;
      }

      const profile =
        (data as WorkspaceProfileType)?.workspaceProfile ?? (data as InstanceProfileType)?.instanceProfile ?? data;
      if (!profile || !semver.valid(profile.version)) {
        throw new Error('Invalid Memos instance profile');
      }
      this.memosProfile = profile;
      if (url === '/api/instance/profile') {
        this.memosVersion = 'modern';
      } else if (semver.lt(profile.version, '0.22.0')) {
        this.memosVersion = 'v1';
      } else if (semver.lt(profile.version, '0.25.0')) {
        this.memosVersion = 'v2';
      } else if (semver.lt(profile.version, '0.26.0')) {
        this.memosVersion = 'v2.5';
      } else {
        this.memosVersion = 'v2.6';
      }
      return;
    }

    throw new Error('No supported Memos profile endpoint');
  }

  async fetchMemosList() {
    if (this.memosVersion === 'v1') {
      const { json: data } = await customRequest<DailyRecordType[] | FetchError>({
        url: `${this.baseURL}/api/v1/memo`,
        headers: {
          Authorization: `Bearer ${this.settings.dailyRecordToken}`,
        },
        params: {
          limit: this.pageSize.toString(),
          offset: this.pageOffset.toString(),
          rowStatus: 'NORMAL',
        },
      });

      if (Array.isArray(data)) {
        return data;
      }

      throw new Error(data.message || data.msg || data.error || JSON.stringify(data));
    }

    let filterParams = {};
    const currentUserResourceName =
      this.memosUserResourceName ?? (this.memosUserId !== null ? `users/${this.memosUserId}` : null);

    if (this.memosVersion === 'modern' || this.memosVersion === 'v2.6') {
      if (!currentUserResourceName) {
        throw new Error('Failed to determine the current memos user');
      }

      // 26.11.2 changed ListMemos to include comments and introduced the parent predicate;
      // stock 26.11.1 rejects that predicate. Keep a wire-level guard as well.
      const excludeComments = this.memosVersion === 'modern' && semver.gte(this.memosProfile.version, '26.11.2');
      filterParams = {
        state: 'NORMAL',
        filter: `creator == ${memosIdentity.celString(currentUserResourceName)}${excludeComments ? ' && parent == null' : ''}`,
      };
    } else if (this.memosVersion === 'v2.5') {
      if (this.memosUserId === null) {
        throw new Error('Failed to determine the current memos user ID');
      }

      filterParams = {
        state: 'NORMAL',
        filter: `creator_id == ${this.memosUserId}`,
      };
    } else if (semver.gte(this.memosProfile.version, '0.24.0')) {
      if (!currentUserResourceName) {
        throw new Error('Failed to determine the current memos user');
      }

      filterParams = {
        parent: currentUserResourceName,
        state: 'NORMAL',
      };
    } else if (semver.gte(this.memosProfile.version, '0.23.0')) {
      if (!currentUserResourceName) {
        throw new Error('Failed to determine the current memos user');
      }

      filterParams = {
        filter: `creator == '${currentUserResourceName}' && state == 'NORMAL'`,
      };
    } else {
      filterParams = {
        filter: 'row_status=="NORMAL"',
      };
    }

    const prefix = this.memosVersion === 'modern' ? '/api' : '/api/v1';
    const { json: data } = await customRequest<DailyRecordResponseTypeV2>({
      url: `${this.baseURL}${prefix}/memos`,
      headers: {
        Authorization: `Bearer ${this.settings.dailyRecordToken}`,
      },
      params: {
        pageSize: this.pageSize.toString(),
        pageToken: this.pageToken,
        ...filterParams,
      },
    });

    if (
      !data ||
      data.code ||
      !Array.isArray(data.memos) ||
      (data.nextPageToken != null && typeof data.nextPageToken !== 'string')
    ) {
      throw new Error(data?.message || 'Invalid Memos list response');
    }

    this.pageToken = data.nextPageToken || '';

    return data.memos
      .filter((memo) => this.memosVersion !== 'modern' || !memo?.parent)
      .map((memo) => transformV2Record(memo, this.memosVersion === 'modern'));
  }

  async fetchResourceList() {
    try {
      if (this.memosVersion === 'v1') {
        const { json: data } = await customRequest<ResourceType[] | FetchError>({
          url: `${this.baseURL}/api/v1/resource`,
          headers: {
            Authorization: `Bearer ${this.settings.dailyRecordToken}`,
          },
        });

        if (Array.isArray(data)) {
          return data;
        }

        throw new Error(data.message || data.msg || data.error || JSON.stringify(data));
      }

      // Try new attachments API for v0.25.0+
      if (this.memosVersion === 'v2.5' || this.memosVersion === 'v2.6') {
        try {
          const { json: data } = await customRequest<{
            attachments: AttachmentType[];
          }>({
            url: `${this.baseURL}/api/v1/attachments`,
            headers: {
              Authorization: `Bearer ${this.settings.dailyRecordToken}`,
            },
          });

          // Convert attachments to resource format for compatibility
          return data?.attachments?.map((attachment) => {
            // Extract the actual resource ID from "attachments/xxx" format
            const resourceId = attachment.name.replace(/^attachments\//, '');
            const resource = {
              id: resourceId,
              name: resourceId, // Use just the ID part to avoid duplicate "attachments/" in path
              filename: attachment.filename,
              externalLink: attachment.external_link || attachment.externalLink,
              type: attachment.type,
              size: attachment.size,
              uid: resourceId, // for v1 compatibility
              // Store original name for download URL
              originalName: attachment.name,
            };
            return resource;
          });
        } catch (attachmentError) {
          // Older Memos builds may lack attachments; permission and transient failures must remain visible.
          if (!isMissingEndpoint(attachmentError)) throw attachmentError;
        }
      }

      // Use legacy resources API for v2 or as fallback
      const { json: data } = await customRequest<ResourceTypeV2>({
        url: `${this.baseURL}/api/v1/resources`,
        headers: {
          Authorization: `Bearer ${this.settings.dailyRecordToken}`,
        },
      });

      if (data.code === 1) {
        throw new Error(data.message);
      }

      return data?.resources;
    } catch (error) {
      if (isMissingEndpoint(error)) return;
      throw error;
    }
  }

  forceSync = () => this.runSync(true);

  sync = () => this.runSync(false);

  private runSync(force: boolean): Promise<void> {
    if (this.pendingSync) {
      // A manual backfill must not reset the state of an in-flight normal sync.
      return force ? this.pendingSync.then(() => this.runSync(true)) : this.pendingSync;
    }

    const task = this.syncMemos(force).finally(() => {
      this.pendingSync = null;
    });
    this.pendingSync = task;
    return task;
  }

  private async syncMemos(force: boolean) {
    if (!this.baseURL) return;
    const syncStarted = Date.now().toString();
    const previousCheckpoint = this.lastTime;
    if (force) this.lastTime = '';
    this.pageOffset = 0;
    this.pageToken = '';
    this.hasCreatedNewFile = false;
    logMessage(getI18n(this.locale)[`${MESSAGE}START_SYNC_USEMEMOS`]);

    let errorKey = 'VERSION_DETECTION_FAILED';
    try {
      await this.getMemosVersion();
      errorKey = 'USER_INFO_FAILED';
      await this.getMemosUserName();
      errorKey = 'DAILY_RECORD_FETCH_FAILED';
      await this.insertDailyRecord();
      if (this.memosVersion !== 'modern') {
        errorKey = 'RESOURCE_FETCH_FAILED';
        await this.downloadResources((await this.fetchResourceList()) || []);
      }

      if (this.hasCreatedNewFile) {
        // Keep the previous checkpoint if Templater is still preparing a new note.
        this.lastTime = previousCheckpoint;
      } else {
        window.localStorage.setItem(this.localKey, syncStarted);
        this.lastTime = syncStarted;
      }
      logMessage(getI18n(this.locale)[`${MESSAGE}END_SYNC_USEMEMOS`]);
    } catch (error) {
      this.lastTime = previousCheckpoint;
      logMessage(`${getI18n(this.locale)[`${ERROR_MESSAGE}${errorKey}`]}: ${error}`, LogLevel.warn);
    }
  }

  private async downloadResources(resources: ResourceType[]) {
    const folder = joinVaultPath(this.settings.periodicNotesPath, 'Attachments');
    for (const resource of resources) {
      if (resource.externalLink) continue;

      const resourcePath = normalizePath(`${folder}/${generateFileName(resource)}`);
      if (await this.app.vault.adapter.exists(resourcePath)) continue;

      let downloadUrl: string;
      if (this.memosVersion === 'modern') {
        downloadUrl = `/file/attachments/${encodeURIComponent(resource.id)}`;
      } else if (this.memosVersion === 'v1') {
        downloadUrl = `/o/r/${resource.uid || resource.name || resource.id}`;
      } else {
        const attachmentName = resource.originalName || resource.name;
        downloadUrl = `/file/${attachmentName}/${encodeURIComponent(resource.filename)}`;
      }

      const { arrayBuffer: data } = await customRequest({
        url: `${this.baseURL}${downloadUrl}`,
        headers: {
          Authorization: `Bearer ${this.settings.dailyRecordToken}`,
        },
      });

      if (!data) throw new Error('Missing Memos attachment content');
      if (!(this.app.vault.getAbstractFileByPath(folder) instanceof TFolder)) {
        await this.app.vault.createFolder(folder);
      }
      await this.app.vault.adapter.writeBinary(resourcePath, data);
    }
  }

  async insertDailyRecord() {
    const seenTokens = new Set<string>();
    while (true) {
      const records = await this.fetchMemosList();
      if (records.some((record) => !Number.isFinite(record.createdTs))) {
        throw new Error('Invalid Memos record timestamp');
      }
      if (this.pageToken && seenTokens.has(this.pageToken)) {
        throw new Error('Memos returned a repeated pagination token');
      }

      const checkpoint = Number(this.lastTime);
      // Compare granularity with the source. Keep the boundary second eligible
      // so a memo created just after the request started cannot be skipped.
      const eligible = records.filter((record) => record.createdTs >= Math.floor(checkpoint / 1000));
      if (this.memosVersion === 'modern') {
        await this.downloadResources(eligible.flatMap((record) => record.resourceList ?? []));
      }
      await this.insertPage(eligible);

      // An empty normalized page can still have a cursor (e.g. only comments).
      if (records.length && !eligible.length) return;
      if (this.memosVersion === 'v1') {
        if (!records.length) return;
        this.pageOffset += this.pageSize;
      } else {
        if (!this.pageToken) return;
        seenTokens.add(this.pageToken);
      }
    }
  }

  private async insertPage(records: DailyRecordType[]) {
    const header = this.settings.dailyRecordHeader;
    const dailyRecordByDay: Record<string, Record<string, string>> = {};
    for (const record of records) {
      if (!record.content && !record.resourceList?.length) {
        continue;
      }

      const [date, timeStamp, formattedRecord] = await formatDailyRecord(record, this.settings.dailyRecordTag);

      if (dailyRecordByDay[date]) {
        dailyRecordByDay[date][timeStamp] = formattedRecord;
      } else {
        dailyRecordByDay[date] = {
          [timeStamp]: formattedRecord,
        };
      }
    }

    const results = await Promise.allSettled(
      Object.keys(dailyRecordByDay).map(async (today) => {
        const momentDay = moment(today);
        const link = `${momentDay.year()}/Daily/${String(momentDay.month() + 1).padStart(
          2,
          '0',
        )}/${momentDay.format('YYYY-MM-DD')}.md`;
        let targetFile = this.file.get(link, '', this.settings.periodicNotesPath);

        if (!targetFile) {
          if (this.settings.dailyRecordCreating) {
            logMessage(`${getI18n(this.locale)[`${ERROR_MESSAGE}CREATING_DAILY_FILE`]} ${today}`);
            await createPeriodicFile(dayjs(today), DAILY, this.settings, this.app);

            // 标记为已创建新文件
            this.hasCreatedNewFile = true;

            await sleep(1000); // 等待 templater 创建完成
            targetFile = this.file.get(link, '', this.settings.periodicNotesPath);
          } else if (this.settings.dailyRecordWarning) {
            logMessage(`${getI18n(this.locale)[`${ERROR_MESSAGE}NO_DAILY_FILE_EXIST`]} ${today}`, LogLevel.warn);
          }
        }
        const reg = generateHeaderRegExp(header);

        if (targetFile instanceof TFile) {
          const dailyFile = targetFile;
          await withVaultLock(this.app.vault, () =>
            this.app.vault.process(dailyFile, (originFileContent) => {
              const regMatch = originFileContent.match(reg);

              if (regMatch?.index === undefined) {
                return originFileContent;
              }

              const localRecordContent = regMatch[2]?.trim();
              const from = regMatch.index + regMatch[1].length;
              const to = regMatch.index + regMatch[0].length;
              const prefix = originFileContent.slice(0, from);
              const suffix = originFileContent.slice(to);
              const localRecordList = localRecordContent ? localRecordContent.split(/\n(?=- )/g) : [];
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
                    const timeStamp = moment(`${today}-${time}`, 'YYYY-MM-DD-HH:mm').unix();

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

              const finalRecordContent = localRecordWithoutTime.concat(sortedRecordList).join('\n');
              const fileContent = `${prefix}\n${finalRecordContent}\n${suffix}`;

              return fileContent;
            }),
          );
        }
      }),
    );
    for (const result of results) {
      if (result.status === 'rejected') throw result.reason;
    }
  }
}
