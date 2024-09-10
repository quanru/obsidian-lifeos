import {
  ARCHIVE,
  AREA,
  DAILY,
  ERROR_MESSAGE,
  FOLDER,
  INDEX,
  MESSAGE,
  MONTHLY,
  PARA,
  PERIODIC,
  PROJECT,
  QUARTERLY,
  RESOURCE,
  TAG,
  WEEKLY,
  YEARLY,
} from './constant';

const EN = {
  HELP: 'Go to the website and ask for help',

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
  [INDEX]: 'Index',

  QUICK_JUMP: 'Double click to open periodic note for this ',
  [`${TAG}ToolTip`]:
    'Tags in PARA notes serve as the unique identifiers for indexing tasks, notes, and files',
  [`${FOLDER}ToolTip`]:
    'The folder where PARA notes are located, is used to store notes related to the corresponding theme',
  [`${INDEX}ToolTip`]:
    'The index filename of PARA notes is used to index tasks, records, and files scattered across various locations. The required formats are LifeOS.README.md/README.md, or the same as the name of the folder it resides in',
  [`${TAG}Required`]: 'A unique id tag is required',
  [`${TAG}Required2`]: `The unique id can't contain spaces`,
  [`${FOLDER}Required`]: 'The folder is required',
  [`${INDEX}Required`]: 'The index file name is required',

  [`${MESSAGE}START_SYNC_USEMEMOS`]: 'Start sync usememos',
  [`${MESSAGE}END_SYNC_USEMEMOS`]: 'End sync usememos',

  [`${ERROR_MESSAGE}FAILED_GET_USEMEMOS_VERSION`]:
    'Failed to fetch usememos workspace profile',
  [`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`]:
    'Please add the tags field for properties !',
  [`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]:
    'You need to install dataview first!',
  [`${ERROR_MESSAGE}FAILED_DATAVIEW_API`]:
    'Dataview API enable failed! Please disable the LifeOS plugin and enable it again!',
  [`${ERROR_MESSAGE}NO_VIEW_PROVIDED`]:
    'Please provide the name of the view you want to query!',
  [`${ERROR_MESSAGE}NO_VIEW_EXISTED`]: 'There is no this view in LifeOS plugin',
  [`${ERROR_MESSAGE}NO_INDEX_FILE_EXIST`]:
    'There is no Index file exists(README.md/xxx.README.md/the same as the name of the folder it resides in)',
  [`${ERROR_MESSAGE}NO_TEMPLATE_EXIST`]: 'There is no template file exist: ',
  [`${ERROR_MESSAGE}TAGS_MUST_INPUT`]: 'Please input tags!',
  [`${ERROR_MESSAGE}DAILY_RECORD_FETCH_FAILED`]: 'Fetch usememos failed',
  [`${ERROR_MESSAGE}RESOURCE_FETCH_FAILED`]: 'Fetch resource failed',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_HEADER`]:
    'Please set which header the usememos need insert to in LifeOS plugin',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_API`]:
    'Please set daily usememos API in LifeOS plugin',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_TOKEN`]:
    'Please set usememos token in LifeOS plugin',
  [`${ERROR_MESSAGE}NO_DAILY_FILE_EXIST`]:
    'Daily file not exists, please create it first: ',
  [`${ERROR_MESSAGE}CREATING_DAILY_FILE`]:
    'Daily file not exists, creating now! ',
};

const ZH = {
  HELP: '打开官网，寻求帮助',

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
  [INDEX]: '索引',

  QUICK_JUMP: '双击打开本周期的',
  [`${TAG}ToolTip`]: 'PARA 笔记的标签，作为索引任务、记录、文件的唯一标识',
  [`${FOLDER}ToolTip`]: 'PARA 笔记所在的文件夹，用于存放对应主题的笔记',
  [`${INDEX}ToolTip`]:
    'PARA 笔记的索引文件名，用于索引散落在各处的任务、记录、文件，要求格式为 LifeOS.README.md/README.md，或与所在目录同名',
  [`${TAG}Required`]: '唯一标识标签为必填项',
  [`${TAG}Required2`]: '唯一标识标签不允许存在空格符',
  [`${FOLDER}Required`]: '所在目录为必填项',
  [`${INDEX}Required`]: '索引文件名为必填项',

  [`${MESSAGE}START_SYNC_USEMEMOS`]: '开始同步 usememos',
  [`${MESSAGE}END_SYNC_USEMEMOS`]: '结束同步 usememos',

  [`${ERROR_MESSAGE}FAILED_GET_USEMEMOS_VERSION`]:
    '获取 usememos workspace profile 失败',
  [`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`]: '请为 Properties 添加 tags 字段！',
  [`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]: '请先安装 dataview！',
  [`${ERROR_MESSAGE}FAILED_DATAVIEW_API`]:
    'Dataview API 开启失败！请关闭 LifeOS 插件后重新打开！',
  [`${ERROR_MESSAGE}NO_VIEW_PROVIDED`]: '请提供所需要查询的视图名！',
  [`${ERROR_MESSAGE}NO_VIEW_EXISTED`]: 'LifeOS 插件中不存在此视图',
  [`${ERROR_MESSAGE}NO_INDEX_FILE_EXIST`]:
    '索引文件不存在（README.md/xxx.README.md/所在文件夹同名文件）',
  [`${ERROR_MESSAGE}NO_TEMPLATE_EXIST`]: '模版文件不存在：',
  [`${ERROR_MESSAGE}TAGS_MUST_INPUT`]: '请输入 tags！',
  [`${ERROR_MESSAGE}DAILY_RECORD_FETCH_FAILED`]: '拉取 usememos 失败',
  [`${ERROR_MESSAGE}RESOURCE_FETCH_FAILED`]: '拉取资源失败',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_HEADER`]:
    '请在 LifeOS 插件中设置 usememos 需要存储在哪个标题之下',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_API`]:
    '请在 LifeOS 插件中设置 usememos 的 API',
  [`${ERROR_MESSAGE}NO_DAILY_RECORD_TOKEN`]:
    '请在 LifeOS 插件中设置 usememos 的 Token',
  [`${ERROR_MESSAGE}NO_DAILY_FILE_EXIST`]: '日记文件不存在，请先创建：',
  [`${ERROR_MESSAGE}CREATING_DAILY_FILE`]: '日记文件不存在，正在创建中！',
};

const I18N_MAP: Record<string, Record<string, string>> = {
  'en-us': EN,
  en: EN,
  'zh-cn': ZH,
  zh: ZH,
};

export function getI18n(lang: string) {
  return I18N_MAP[lang] || EN;
}
