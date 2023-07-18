export interface PluginSettings {
  periodicNotesPath: string,
  projectsPath: string,
  areasPath: string,
  resourcesPath: string,
  archivesPath: string,
  projectListHeader: string;
  areaListHeader: string;
  habitHeader: string;
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
