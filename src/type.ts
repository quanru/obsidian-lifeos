import type { App } from 'obsidian';

export interface PluginSettings {
  periodicNotesPath: string;
  projectsPath: string;
  areasPath: string;
  resourcesPath: string;
  archivesPath: string;
  projectListHeader: string;
  areaListHeader: string;
  habitHeader: string;
  dailyRecordHeader: string;
  dailyRecordAPI: string;
  dailyRecordToken: string;
  useDailyRecord: boolean;
  usePeriodicNotes: boolean;
  usePARANotes: boolean;
}

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
  date?: TaskStatusType;
  from?: string | null;
  to?: string | null;
};

export type ContextType = { app: App; settings: PluginSettings, width: number };

export type ResourceType = {
  id: string;
  filename: string;
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

export type FetchError = {
  code: number;
  message: string;
  msg?: string;
  error?: string;
};

export enum LogLevel {
  'info',
  'warn',
  'error',
}
