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

  // 添加 SettingTab 相关的翻译
  SETTING_PERIODIC_NOTES: 'Periodic Notes',
  SETTING_PARA_NOTES: 'PARA Notes',
  SETTING_TURN_ON: 'Turn on',
  SETTING_PERIODIC_NOTES_FOLDER: 'Periodic Notes Folder',
  SETTING_HABIT_HEADER: 'Habit Header:',
  SETTING_HABIT_HEADER_HELP: 'Where the habit module is in a daily note',
  SETTING_PROJECT_LIST_HEADER: 'Project List Header:',
  SETTING_PROJECT_LIST_HEADER_HELP: 'Where the project list is in a daily note',
  SETTING_AREA_LIST_HEADER: 'Area List Header:',
  SETTING_AREA_LIST_HEADER_HELP: 'Where the area list is in a quarterly note',
  SETTING_WEEK_START: 'Week Start:',
  SETTING_WEEK_START_HELP: 'The start day of the week',
  SETTING_CHINESE_CALENDAR: 'Chinese Calendar:',
  SETTING_CHINESE_CALENDAR_HELP: 'Show chinese calendar and holidays',
  SETTING_ADVANCED_SETTINGS: 'Advanced Settings',
  SETTING_ADVANCED_SETTINGS_HELP: 'Custom template file Path',
  SETTING_TEMPLATE: 'Template',
  SETTING_DAILY_RECORD: 'Daily Record',
  SETTING_DAILY_RECORD_HELP: 'Sync daily record from ',
  SETTING_DAILY_RECORD_HEADER: 'Header:',
  SETTING_DAILY_RECORD_HEADER_HELP:
    'Where the daily record module is in a daily note',
  SETTING_DAILY_RECORD_API: 'API:',
  SETTING_DAILY_RECORD_API_HELP:
    'The usememos service URL, < 0.22.0 or >= 0.22.3',
  SETTING_DAILY_RECORD_TOKEN: 'Token:',
  SETTING_DAILY_RECORD_TOKEN_HELP: 'The token of your API ',
  SETTING_DAILY_RECORD_CREATING: 'Auto Creating:',
  SETTING_DAILY_RECORD_CREATING_HELP:
    'Auto creating while daily note not exist',
  SETTING_DAILY_RECORD_WARNING: 'Warning:',
  SETTING_DAILY_RECORD_WARNING_HELP: 'Warning while daily note not exist',
  SETTING_PROJECTS_FOLDER: 'Projects Folder:',
  SETTING_AREAS_FOLDER: 'Areas Folder:',
  SETTING_RESOURCES_FOLDER: 'Resources Folder:',
  SETTING_ARCHIVES_FOLDER: 'Archives Folder:',
  SETTING_INDEX_FILENAME: 'Index Filename:',

  SETTING_WEEK_START_AUTO: 'Auto',
  SETTING_WEEK_START_MONDAY: 'Monday',
  SETTING_WEEK_START_TUESDAY: 'Tuesday',
  SETTING_WEEK_START_WEDNESDAY: 'Wednesday',
  SETTING_WEEK_START_THURSDAY: 'Thursday',
  SETTING_WEEK_START_FRIDAY: 'Friday',
  SETTING_WEEK_START_SATURDAY: 'Saturday',
  SETTING_WEEK_START_SUNDAY: 'Sunday',

  SETTING_INDEX_FILENAME_FOLDER: 'FolderName.md',
  SETTING_INDEX_FILENAME_README: '*.README.md',

  // command and ribbon
  COMMAND_CREATE_NOTES: 'LifeOS Creation',
  COMMAND_CREATE_DAILY_NOTE: 'Create Daily Note',
  COMMAND_CREATE_WEEKLY_NOTE: 'Create Weekly Note',
  COMMAND_CREATE_MONTHLY_NOTE: 'Create Monthly Note',
  COMMAND_CREATE_QUARTERLY_NOTE: 'Create Quarterly Note',
  COMMAND_CREATE_YEARLY_NOTE: 'Create Yearly Note',
  COMMAND_LIFEOS_GUIDE: 'LifeOS Guide',
  COMMAND_SYNC_DAILY_RECORDS: 'Sync Memos',
  COMMAND_FORCE_SYNC_DAILY_RECORDS: 'Force Sync Memos',

  // TopBanner
  TOPBANNER_BUGS_FEATURES: 'Bugs & Feature Requests',
  TOPBANNER_BUGS_FEATURES_HREF:
    'https://github.com/quanru/obsidian-lifeos/issues',
  TOPBANNER_VIDEO: 'LifeOS on YouTube',
  TOPBANNER_VIDEO_HREF: 'https://www.youtube.com/@lifeos-pro',
  TOPBANNER_CONTACT: 'Contact us',
  TOPBANNER_CONTACT_HREF: 'https://lifeos.vip/contact/index.html',
  TOPBANNER_SOCIAL: 'Follow me on Twitter',
  TOPBANNER_SOCIAL_HREF: 'https://x.com/quan_ru',
  TOPBANNER_LIFEOS_PRO: 'LifeOS Pro',
  TOPBANNER_LIFEOS_PRO_HREF: 'https://lifeos.vip/plugin/life-os-pro.html',
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
  [`${FOLDER}ToolTip`]: 'PARA 笔记所在的目录，用于存放对应主题的笔记',
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
  [`${ERROR_MESSAGE}NO_FRONT_MATTER_TAG`]: '请为 Properties 加 tags 字段！',
  [`${ERROR_MESSAGE}NO_DATAVIEW_INSTALL`]: '请先安装 dataview！',
  [`${ERROR_MESSAGE}FAILED_DATAVIEW_API`]:
    'Dataview API 开启失败！请关闭 LifeOS 插件后重新打开！',
  [`${ERROR_MESSAGE}NO_VIEW_PROVIDED`]: '请提供所需要查询的视图名！',
  [`${ERROR_MESSAGE}NO_VIEW_EXISTED`]: 'LifeOS 插件中不存在此视图',
  [`${ERROR_MESSAGE}NO_INDEX_FILE_EXIST`]:
    '索引文件不存在（README.md/xxx.README.md/所在目录同名文件）',
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

  // 添加 SettingTab 相关的翻译
  SETTING_PERIODIC_NOTES: '周期笔',
  SETTING_PARA_NOTES: 'PARA 笔记',
  SETTING_TURN_ON: '开启',
  SETTING_PERIODIC_NOTES_FOLDER: '周期笔记目录',
  SETTING_HABIT_HEADER: '习惯标题：',
  SETTING_HABIT_HEADER_HELP: '习惯模块在日记中的位置',
  SETTING_PROJECT_LIST_HEADER: '项目列表标题：',
  SETTING_PROJECT_LIST_HEADER_HELP: '项目列表在日记中的位置',
  SETTING_AREA_LIST_HEADER: '领域列表标题：',
  SETTING_AREA_LIST_HEADER_HELP: '领域列表在季记中的位置',
  SETTING_WEEK_START: '每周开始日：',
  SETTING_WEEK_START_HELP: '设置每周的开始日',
  SETTING_CHINESE_CALENDAR: '农历：',
  SETTING_CHINESE_CALENDAR_HELP: '显示农历和节假日',
  SETTING_ADVANCED_SETTINGS: '高级设置',
  SETTING_ADVANCED_SETTINGS_HELP: '自定义模板文件路径',
  SETTING_TEMPLATE: '模板',
  SETTING_DAILY_RECORD: '每日记录',
  SETTING_DAILY_RECORD_HELP: '从以下服务同步每日记录：',
  SETTING_DAILY_RECORD_HEADER: '标题：',
  SETTING_DAILY_RECORD_HEADER_HELP: '每日记录模块在日记中的位置',
  SETTING_DAILY_RECORD_API: 'API：',
  SETTING_DAILY_RECORD_API_HELP: 'usememos 服务 URL, < 0.22.0 或 >= 0.22.3',
  SETTING_DAILY_RECORD_TOKEN: 'Token：',
  SETTING_DAILY_RECORD_TOKEN_HELP: '你的 API 对应的 ',
  SETTING_DAILY_RECORD_CREATING: '自动创建：',
  SETTING_DAILY_RECORD_CREATING_HELP: '当日记不存在时自动创建',
  SETTING_DAILY_RECORD_WARNING: '警告：',
  SETTING_DAILY_RECORD_WARNING_HELP: '当日记不存在时警告',
  SETTING_PROJECTS_FOLDER: '项目目录：',
  SETTING_AREAS_FOLDER: '领域目录：',
  SETTING_RESOURCES_FOLDER: '资源目录：',
  SETTING_ARCHIVES_FOLDER: '存档目录：',
  SETTING_INDEX_FILENAME: '索引文件名：',

  SETTING_WEEK_START_AUTO: '自动',
  SETTING_WEEK_START_MONDAY: '星期一',
  SETTING_WEEK_START_TUESDAY: '星期二',
  SETTING_WEEK_START_WEDNESDAY: '星期三',
  SETTING_WEEK_START_THURSDAY: '星期四',
  SETTING_WEEK_START_FRIDAY: '星期五',
  SETTING_WEEK_START_SATURDAY: '星期六',
  SETTING_WEEK_START_SUNDAY: '星期日',

  SETTING_INDEX_FILENAME_FOLDER: '文件夹名.md',
  SETTING_INDEX_FILENAME_README: '*.README.md',

  // command and ribbon
  COMMAND_CREATE_NOTES: 'LifeOS 创建',
  COMMAND_CREATE_DAILY_NOTE: '创建日记',
  COMMAND_CREATE_WEEKLY_NOTE: '创建周记',
  COMMAND_CREATE_MONTHLY_NOTE: '创建月记',
  COMMAND_CREATE_QUARTERLY_NOTE: '创建季记',
  COMMAND_CREATE_YEARLY_NOTE: '创建年记',
  COMMAND_LIFEOS_GUIDE: 'LifeOS 指南',
  COMMAND_SYNC_DAILY_RECORDS: '同步 memos',
  COMMAND_FORCE_SYNC_DAILY_RECORDS: '强制同步 memos',

  // TopBanner
  TOPBANNER_BUGS_FEATURES: '问题反馈和功能请求',
  TOPBANNER_BUGS_FEATURES_HREF:
    'https://github.com/quanru/obsidian-lifeos/issues',
  TOPBANNER_VIDEO: 'LifeOS 哔哩哔哩',
  TOPBANNER_VIDEO_HREF: 'https://space.bilibili.com/437191204',
  TOPBANNER_CONTACT: '联系我们',
  TOPBANNER_CONTACT_HREF: 'https://lifeos.vip/zh/contact/index.html',
  TOPBANNER_SOCIAL: 'LifeOS 小红书',
  TOPBANNER_SOCIAL_HREF:
    'https://www.xiaohongshu.com/user/profile/5b06db60f7e8b974ec6ff7fc',
  TOPBANNER_LIFEOS_PRO: 'LifeOS Pro',
  TOPBANNER_LIFEOS_PRO_HREF: 'https://lifeos.vip/zh/plugin/life-os-pro.html',
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
