import type { Locale } from 'antd/es/locale';
import type { App } from 'obsidian';

export type PeriodicNotesTemplateFilePath =
  | 'periodicNotesTemplateFilePathYearly'
  | 'periodicNotesTemplateFilePathQuarterly'
  | 'periodicNotesTemplateFilePathMonthly'
  | 'periodicNotesTemplateFilePathWeekly'
  | 'periodicNotesTemplateFilePathDaily';

export type IndexType = 'readme' | 'folderName';

export type PluginSettings = {
  periodicNotesPath: string;
  usePeriodicAdvanced: boolean;
  projectsPath: string;
  projectsTemplateFilePath: string;
  areasPath: string;
  areasTemplateFilePath: string;
  resourcesPath: string;
  resourcesTemplateFilePath: string;
  archivesPath: string;
  archivesTemplateFilePath: string;
  projectListHeader: string;
  areaListHeader: string;
  habitHeader: string;
  dailyRecordHeader: string;
  dailyRecordAPI: string;
  dailyRecordToken: string;
  dailyRecordWarning: boolean;
  dailyRecordCreating: boolean;
  useDailyRecord: boolean;
  usePeriodicNotes: boolean;
  usePARANotes: boolean;
  usePARAAdvanced: boolean;
  paraIndexFilename: IndexType;
  weekStart: number;
  useChineseCalendar: boolean;
} & Record<PeriodicNotesTemplateFilePath, string>;

export type DateType = {
  year: number | null;
  month: number | null;
  quarter: number | null;
  week: number | null;
  day: number | null;
};

export type DateRangeType = {
  from: string | null;
  to: string | null;
};

export enum TaskStatusType {
  DONE = 'DONE',
  RECORD = 'RECORD',
}

export type TaskConditionType = {
  status?: TaskStatusType;
  from?: string | null;
  to?: string | null;
};

export type ContextType = {
  app: App;
  settings: PluginSettings;
  locale: Locale;
};

export type ResourceType = {
  name?: string;
  externalLink?: string;
  type?: string;
  uid?: string;
  id: string;
  filename: string;
};

export type ResourceTypeV2 = {
  code?: number;
  message?: string;
  nextPageToken: string;
  resources: ResourceType[];
};

export type DailyRecordType = {
  rowStatus: 'ARCHIVED' | 'ACTIVE' | 'NORMAL';
  updatedTs: number;
  createdTs: number;
  createdAt: string;
  updatedAt: string;
  content: string;
  resourceList?: ResourceType[];
};

export type DailyRecordTypeV2 = {
  rowStatus: 'ARCHIVED' | 'ACTIVE' | 'NORMAL';
  content: string;
  updateTime: number;
  createTime: number;
  resources?: ResourceType[];
};

export type DailyRecordResponseTypeV2 = {
  code?: number;
  message?: string;
  nextPageToken: string;
  memos: DailyRecordTypeV2[];
};

export type WorkspaceProfileType = {
  owner: string;
  version: string;
  mode: string;
  instanceUrl: boolean;
  workspaceProfile?: {
    owner: string;
    version: string;
    mode: string;
    instanceUrl: boolean;
  };
};

export type FetchError = {
  code: number;
  message: string;
  msg?: string;
  error?: string;
};

export enum LogLevel {
  info = 0,
  warn = 1,
  error = 2,
}
