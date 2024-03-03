export const ERROR_MESSAGES = {
  NO_FRONT_MATTER_TAG: 'Please add the tags field for frontMatter!',
  NO_DATAVIEW_INSTALL: 'You need to install dataview first!',
  FAILED_DATAVIEW_API: 'Dataview API enable failed!',
  NO_VIEW_PROVIDED: 'Please provide a view name!',
  NO_VIEW_EXISTED: 'There is no this view in periodic PARA plugin',
  NO_INDEX_FILE_EXIST: 'There is no Index file exists(README.md/xxx.README.md/',
  NO_TEMPLATE_EXIST: 'There is no template file exist: ',
  TAGS_MUST_INPUT: 'Please input tags!',
  DAILY_RECORD_FETCH_FAILED: 'Fetch daily record failed: ',
  RESOURCE_FETCH_FAILED: 'Fetch resource failed: ',
  NO_DAILY_RECORD_HEADER:
    'Please set daily record header in Periodic PARA plugin',
  NO_DAILY_RECORD_API: 'Please set daily record API in Periodic PARA plugin',
  NO_DAILY_RECORD_TOKEN:
    'Please set daily record access token in Periodic PARA plugin',
  NO_DAILY_FILE_EXIST: 'Daily file not exists, please create it first: ',
};

export const PARA = 'PARA Notes';
export const PROJECT = 'Project';
export const AREA = 'Area';
export const RESOURCE = 'Resource';
export const ARCHIVE = 'Archive';

export const PERIODIC = 'Periodic Notes';
export const DAILY = 'Daily';
export const WEEKLY = 'Weekly';
export const MONTHLY = 'Monthly';
export const QUARTERLY = 'Quarterly';
export const YEARLY = 'Yearly';

export const TAG = 'Tag';
export const FOLDER = 'Folder';
export const INDEX = 'Index';

export const DAILY_REG = /^\d{4}-\d{2}-(\d{2})/;
export const WEEKLY_REG = /^\d{4}-W(\d{1,2})/;
export const MONTHLY_REG = /^\d{4}-(\d{1,2})/;
export const QUARTERLY_REG = /^\d{4}-Q(\d{1,2})/;
export const YEARLY_REG = /(^\d{4})/;

export const LIFE_OS_OFFICIAL_SITE = 'https://obsidian-life-os.netlify.app';

export const LOCALE_MAP: Record<string, Record<string, string>> = {
  'en-us': {
    [PERIODIC]: 'Periodic Notes',
    [DAILY]: 'Day',
    [WEEKLY]: 'Week',
    [MONTHLY]: 'Month',
    [QUARTERLY]: 'Quarter',
    [YEARLY]: 'Year',
    [PARA]: 'PARA Notes',
    [PROJECT]: 'Project',
    [AREA]: 'Area',
    [RESOURCE]: 'Resource',
    [ARCHIVE]: 'Archive',
    [TAG]: 'Tag',
    [FOLDER]: 'Folder',
    [INDEX]: 'Index'
  },
  'zh-cn': {
    [PERIODIC]: '周期笔记',
    [DAILY]: '日记',
    [WEEKLY]: '周记',
    [MONTHLY]: '月记',
    [QUARTERLY]: '季记',
    [YEARLY]: '年记',
    [PARA]: 'PARA 笔记',
    [PROJECT]: '项目',
    [AREA]: '领域',
    [RESOURCE]: '资源',
    [ARCHIVE]: '存档',
    [TAG]: '标签',
    [FOLDER]: '目录',
    [INDEX]: '索引'
  },
};
