import translations from './translations.json';
import { ARCHIVE, AREA, DAILY, MONTHLY, PROJECT, QUARTERLY, RESOURCE, WEEKLY, YEARLY } from '../constant';
import { getFeatureI18n } from '../feature-i18n';
import type { PeriodicNotesTemplateFilePath, PluginSettings } from '../type';
import { joinVaultPath } from '../util';

export type WorkspaceMode = 'periodic' | 'para';
export { normalizeWorkspaceLocale } from './locale';
import { normalizeWorkspaceLocale } from './locale';
export type { WorkspaceLocale } from './locale';
import type { WorkspaceLocale } from './locale';

export type TemplatePlan = {
  path: string;
  content: string;
  role?: 'template' | 'guide' | 'example';
};

export type WorkspaceModeGuide = {
  bestFor: string;
  notFor: string;
  dailyFlow: string;
};

const MODE_GUIDES: Record<'en' | 'zh-cn' | 'zh-tw', Record<WorkspaceMode, WorkspaceModeGuide>> = {
  en: {
    periodic: {
      bestFor: 'A lightweight journal built around daily capture and periodic review.',
      notFor: 'Knowledge that needs durable project and responsibility folders.',
      dailyFlow: 'Capture in Today → mark the next action → review the week.',
    },
    para: {
      bestFor: 'Personal knowledge tied to active projects and long-lived responsibilities.',
      notFor: 'A zero-maintenance chronological journal or a task list only.',
      dailyFlow: 'Capture → connect to Project or Area → use Resources → Archive.',
    },
  },
  'zh-cn': {
    periodic: {
      bestFor: '围绕日常记录和周期复盘建立轻量工作流。',
      notFor: '需要长期维护项目、责任领域和资料目录的知识。',
      dailyFlow: '在 Today 捕获 → 标记下一步 → 每周回顾。',
    },
    para: {
      bestFor: '围绕活跃项目和长期责任组织个人知识。',
      notFor: '完全不想维护结构的时间流记录，或单纯任务清单。',
      dailyFlow: '捕获 → 连接项目或领域 → 使用资源 → 归档。',
    },
  },
  'zh-tw': {
    periodic: {
      bestFor: '圍繞日常記錄和週期回顧建立輕量工作流程。',
      notFor: '需要長期維護專案、責任領域和資料目錄的知識。',
      dailyFlow: '在 Today 捕獲 → 標記下一步 → 每週回顧。',
    },
    para: {
      bestFor: '圍繞活躍專案和長期責任組織個人知識。',
      notFor: '完全不想維護結構的時間流記錄，或單純任務清單。',
      dailyFlow: '捕獲 → 連結專案或領域 → 使用資源 → 封存。',
    },
  },
};

export function getWorkspaceModeGuide(mode: WorkspaceMode, locale?: string): WorkspaceModeGuide {
  const normalized = normalizeWorkspaceLocale(locale);
  const translated = translations[normalized as keyof typeof translations];
  return translated ? translated.guides[mode] : MODE_GUIDES[normalized as 'en' | 'zh-cn' | 'zh-tw'][mode];
}

export function getLocalizedWorkspaceSettings(settings: PluginSettings, locale?: string): PluginSettings {
  const normalized = normalizeWorkspaceLocale(locale);
  const translated = translations[normalized as keyof typeof translations];
  if (translated) return { ...settings, ...translated.settings, locale: normalized };
  const localized =
    normalized === 'en'
      ? {
          periodicNotesPath: '0. Periodic Notes',
          projectsPath: '1. Projects',
          areasPath: '2. Areas',
          resourcesPath: '3. Resources',
          archivesPath: '4. Archive',
          dailyRecordHeader: 'Daily Record',
          projectListHeader: 'Project List',
          areaListHeader: 'Areas',
          habitHeader: 'Habits',
        }
      : normalized === 'zh-cn'
        ? {
            periodicNotesPath: '0. 周期笔记',
            projectsPath: '1. 项目',
            areasPath: '2. 领域',
            resourcesPath: '3. 资源',
            archivesPath: '4. 归档',
            dailyRecordHeader: '日常记录',
            projectListHeader: '项目列表',
            areaListHeader: '领域',
            habitHeader: '习惯',
          }
        : {
            periodicNotesPath: '0. 週期筆記',
            projectsPath: '1. 專案',
            areasPath: '2. 領域',
            resourcesPath: '3. 資源',
            archivesPath: '4. 封存',
            dailyRecordHeader: '日常記錄',
            projectListHeader: '專案列表',
            areaListHeader: '領域',
            habitHeader: '習慣',
          };
  return { ...settings, ...localized, locale: normalized };
}

function getOnboardingCopy(locale?: string) {
  const normalized = normalizeWorkspaceLocale(locale);
  const translated = translations[normalized as keyof typeof translations];
  if (translated) return translated.copy;
  if (normalized === 'zh-cn') {
    return {
      startPath: 'LifeOS 开始使用.md',
      title: '开始使用 LifeOS',
      lead: '请用自己的真实内容完成下面这个五分钟闭环。',
      checklist: '最初五分钟',
      steps: [
        '打开 Today，从今天开始',
        '快速记录一个真实想法',
        '创建一个具体的下一步任务',
        '只在需要时连接到 PARA',
        '运行“每周回顾”，填写本周总结',
      ],
      destinations: '工作入口',
      exampleFolder: 'LifeOS 示例',
      exampleFile: '第一个工作流.md',
      exampleTitle: '第一个真实工作流',
      exampleLead: '先捕获，再把真正有用的内容连接到行动与结构。',
      exampleSteps: [
        '一条在消失前捕获的真实想法。',
        '把它变成一个足够小的下一步行动。',
        '周末回顾，只保留真正重要的内容。',
      ],
    };
  }
  if (normalized === 'zh-tw') {
    return {
      startPath: 'LifeOS 開始使用.md',
      title: '開始使用 LifeOS',
      lead: '請用自己的真實內容完成下面這個五分鐘閉環。',
      checklist: '最初五分鐘',
      steps: [
        '開啟 Today，從今天開始',
        '快速記錄一個真實想法',
        '建立一個具體的下一步任務',
        '只在需要時連結到 PARA',
        '執行「每週回顧」，填寫本週總結',
      ],
      destinations: '工作入口',
      exampleFolder: 'LifeOS 範例',
      exampleFile: '第一個工作流程.md',
      exampleTitle: '第一個真實工作流程',
      exampleLead: '先捕獲，再把真正有用的內容連結到行動與結構。',
      exampleSteps: [
        '一條在消失前捕獲的真實想法。',
        '把它變成一個足夠小的下一步行動。',
        '週末回顧，只保留真正重要的內容。',
      ],
    };
  }
  return {
    startPath: 'LifeOS Start Here.md',
    title: 'Start Here',
    lead: 'Complete this five-minute loop with your own material.',
    checklist: 'Your first five minutes',
    steps: [
      'Open Today and start from the present',
      'Quick-capture one real thought',
      'Create one concrete next-action task',
      'Connect it to PARA only when useful',
      'Run Weekly review and write your first reflection',
    ],
    destinations: 'Working destinations',
    exampleFolder: 'LifeOS Examples',
    exampleFile: 'First workflow.md',
    exampleTitle: 'Your first real workflow',
    exampleLead: 'Capture first, then connect useful material to action and structure.',
    exampleSteps: [
      'A thought captured before it disappeared.',
      'Turn it into one small next action.',
      'Review it at the end of the week and keep only what matters.',
    ],
  };
}

export function getStartHerePlan(settings: PluginSettings, mode: WorkspaceMode, locale?: string): TemplatePlan {
  const copy = getOnboardingCopy(locale);
  const guide = getWorkspaceModeGuide(mode, locale);
  return {
    path: copy.startPath,
    role: 'guide',
    content: [
      `# ${copy.title}`,
      '',
      copy.lead,
      '',
      `> ${guide.dailyFlow}`,
      '',
      `## ${copy.checklist}`,
      '',
      ...copy.steps.map((step) => `- [ ] ${step}`),
      '',
      `## ${copy.destinations}`,
      '',
      `- ${getFeatureI18n(locale).setupOpenToday}: \`${settings.periodicNotesPath}\``,
      ...(mode === 'para'
        ? [
            `- ${getFeatureI18n(locale).templateProjects}: \`${settings.projectsPath}\``,
            `- ${getFeatureI18n(locale).templateAreas}: \`${settings.areasPath}\``,
            `- ${settings.resourcesPath.replace(/^\d+\. /, '')}: \`${settings.resourcesPath}\``,
          ]
        : []),
      '',
    ].join('\n'),
  };
}

export function getExamplePlan(mode: WorkspaceMode, locale?: string): TemplatePlan {
  const copy = getOnboardingCopy(locale);
  return {
    path: `${copy.exampleFolder}/${copy.exampleFile}`,
    role: 'example',
    content: [
      '---',
      'lifeos-onboarding-example: true',
      `lifeos-template: ${mode}`,
      '---',
      '',
      `# ${copy.exampleTitle}`,
      '',
      copy.exampleLead,
      '',
      `- ${copy.exampleSteps[0]}`,
      `- [ ] ${copy.exampleSteps[1]}`,
      `- ${copy.exampleSteps[2]}`,
      '',
    ].join('\n'),
  };
}

const codeBlock = (view: string) => `\`\`\`LifeOS\n${view}\n\`\`\``;

function getPeriodicTemplatePath(settings: PluginSettings, periodType: string): string {
  const settingKey = `periodicNotesTemplateFilePath${periodType}` as PeriodicNotesTemplateFilePath;

  if (settings.usePeriodicAdvanced && settings[settingKey]) {
    return settings[settingKey];
  }

  return joinVaultPath(settings.periodicNotesPath, 'Templates', `${periodType}.md`);
}

function buildDailyTemplate(settings: PluginSettings, mode: WorkspaceMode, locale?: string): string {
  const t = getFeatureI18n(locale);
  const sections = [`# ${t.templateDailyTitle}`, `## ${settings.dailyRecordHeader}`, ''];

  if (mode === 'para') {
    sections.push(`## ${settings.projectListHeader}`, '', '0hr0', '');
  }

  sections.push(`## ${settings.habitHeader}`, '', '- [ ] ', '');

  return `${sections.join('\n').trimEnd()}\n`;
}

function buildReviewTemplate(
  title: string,
  settings: PluginSettings,
  mode: WorkspaceMode,
  locale?: string,
  includeAreaInput = false,
): string {
  const t = getFeatureI18n(locale);
  const sections = [
    `# ${title}`,
    '',
    `## ${t.templateTasksRecorded}`,
    '',
    codeBlock('TaskRecordListByTime'),
    '',
    `## ${t.templateTasksCompleted}`,
    '',
    codeBlock('TaskDoneListByTime'),
    '',
    `## ${t.templateDailyRecords}`,
    '',
    codeBlock('BulletRecordListByTime'),
  ];

  if (mode === 'para') {
    sections.push('', `## ${t.templateProjects}`, '', codeBlock('ProjectListByTime'));
  }

  if (mode === 'para' && includeAreaInput) {
    sections.push('', `## ${settings.areaListHeader}`, '');
  }

  return `${sections.join('\n').trimEnd()}\n`;
}

function buildYearlyTemplate(settings: PluginSettings, mode: WorkspaceMode, locale?: string): string {
  const t = getFeatureI18n(locale);
  const base = buildReviewTemplate(t.templateYearlyTitle, settings, mode, locale).trimEnd();

  if (mode !== 'para') return `${base}\n`;

  return `${base}\n\n## ${t.templateAreas}\n\n${codeBlock('AreaListByTime')}\n`;
}

function buildParaTemplate(locale?: string): string {
  const t = getFeatureI18n(locale);

  return [
    `# ${t.templateOverview}`,
    '',
    `## ${t.templateTasks}`,
    '',
    codeBlock('TaskListByTag'),
    '',
    `## ${t.templateRecords}`,
    '',
    codeBlock('BulletListByTag'),
    '',
    `## ${t.templateFiles}`,
    '',
    codeBlock('FileListByTag'),
    '',
  ].join('\n');
}

function getParaTemplatePath(settings: PluginSettings, type: string): string {
  const pathKey = `${type.toLocaleLowerCase()}sPath` as keyof PluginSettings;
  const templateKey = `${type.toLocaleLowerCase()}sTemplateFilePath` as keyof PluginSettings;
  const customTemplate = settings[templateKey];

  if (settings.usePARAAdvanced && typeof customTemplate === 'string' && customTemplate) {
    return customTemplate;
  }

  return `${settings[pathKey]}/Template.md`;
}

export function getBasicTemplatePlans(
  settings: PluginSettings,
  mode: WorkspaceMode,
  locale?: string,
  options: { includeGuide?: boolean; includeExample?: boolean } = {},
): TemplatePlan[] {
  const t = getFeatureI18n(locale);
  const plans: TemplatePlan[] = [
    {
      path: getPeriodicTemplatePath(settings, DAILY),
      content: buildDailyTemplate(settings, mode, locale),
    },
    {
      path: getPeriodicTemplatePath(settings, WEEKLY),
      content: buildReviewTemplate(t.templateWeeklyTitle, settings, mode, locale),
    },
    {
      path: getPeriodicTemplatePath(settings, MONTHLY),
      content: buildReviewTemplate(t.templateMonthlyTitle, settings, mode, locale),
    },
    {
      path: getPeriodicTemplatePath(settings, QUARTERLY),
      content: buildReviewTemplate(t.templateQuarterlyTitle, settings, mode, locale, true),
    },
    {
      path: getPeriodicTemplatePath(settings, YEARLY),
      content: buildYearlyTemplate(settings, mode, locale),
    },
  ];

  if (mode === 'para') {
    [PROJECT, AREA, RESOURCE, ARCHIVE].forEach((type) => {
      plans.push({
        path: getParaTemplatePath(settings, type),
        content: buildParaTemplate(locale),
      });
    });
  }

  if (options.includeGuide !== false) plans.push(getStartHerePlan(settings, mode, locale));
  if (options.includeExample) plans.push(getExamplePlan(mode, locale));

  return plans;
}
