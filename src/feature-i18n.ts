import { normalizeWorkspaceLocale } from './onboarding/locale';
import de from './locales/features-de.json';
import es from './locales/features-es.json';
import fr from './locales/features-fr.json';
import pt from './locales/features-pt.json';
import ja from './locales/features-ja.json';
import ko from './locales/features-ko.json';
import ar from './locales/features-ar.json';

export type FeatureI18n = {
  setupTitle: string;
  setupDescription: string;
  setupLanguage: string;
  setupLanguageDescription: string;
  setupMode: string;
  setupPeriodicOnly: string;
  setupPeriodicOnlyDescription: string;
  setupPara: string;
  setupParaDescription: string;
  setupSafety: string;
  setupPreview: string;
  setupBestFor: string;
  setupNotFor: string;
  setupDailyFlow: string;
  setupIncludeExamples: string;
  setupIncludeExamplesDescription: string;
  setupLocked: string;
  setupLater: string;
  setupSubmit: string;
  setupWorking: string;
  setupSuccess: (createdCount: number, skippedCount: number) => string;
  setupFailed: string;
  setupCompleteTitle: string;
  setupCompleteDescription: string;
  setupOpenGuide: string;
  setupOpenToday: string;
  setupQuickRecord: string;
  setupQuickTask: string;
  setupRemoveExamples: string;
  setupExamplesRemoved: string;
  setupExamplesPreserved: string;
  setupCommand: string;
  quickRecordCommand: string;
  quickTaskCommand: string;
  quickRecordTitle: string;
  quickTaskTitle: string;
  quickRecordPlaceholder: string;
  quickTaskPlaceholder: string;
  quickCaptureDescription: string;
  quickCaptureSubmit: string;
  quickCaptureWorking: string;
  quickCaptureEmpty: string;
  quickCaptureSuccess: string;
  quickCaptureFailed: string;
  templateDailyTitle: string;
  templateWeeklyTitle: string;
  templateMonthlyTitle: string;
  templateQuarterlyTitle: string;
  templateYearlyTitle: string;
  templateTasksRecorded: string;
  templateTasksCompleted: string;
  templateDailyRecords: string;
  templateProjects: string;
  templateAreas: string;
  templateOverview: string;
  templateTasks: string;
  templateRecords: string;
  templateFiles: string;
};

const EN: FeatureI18n = {
  setupTitle: 'Set up LifeOS',
  setupDescription: 'Install a safe starter workspace so you can create your first note immediately.',
  setupLanguage: 'Template language',
  setupLanguageDescription: 'Controls the language of generated folders, templates, and the getting-started guide.',
  setupMode: 'Workspace mode',
  setupPeriodicOnly: 'Periodic notes only',
  setupPeriodicOnlyDescription: 'Daily capture and periodic reviews without PARA folders.',
  setupPara: 'Periodic notes + PARA',
  setupParaDescription: 'Add Projects, Areas, Resources, and Archives to the periodic workflow.',
  setupSafety: 'Only missing folders and templates will be created. Existing files are never overwritten.',
  setupPreview: 'Files prepared by this setup',
  setupBestFor: 'Best for',
  setupNotFor: 'Not ideal for',
  setupDailyFlow: 'Daily flow',
  setupIncludeExamples: 'Include one example workflow',
  setupIncludeExamplesDescription: 'Adds one isolated example that can be removed later if it remains unchanged.',
  setupLocked: 'This workspace has already selected a template and language. Existing structure will be kept.',
  setupLater: 'Later',
  setupSubmit: "Set up and create today's note",
  setupWorking: 'Setting up…',
  setupSuccess: (createdCount, skippedCount) =>
    `LifeOS is ready. Created ${createdCount} item(s); kept ${skippedCount} existing item(s).`,
  setupFailed: 'LifeOS setup failed',
  setupCompleteTitle: 'Your workspace is ready',
  setupCompleteDescription: 'Try one real action now. Five minutes is enough to complete the first loop.',
  setupOpenGuide: 'Open Start Here',
  setupOpenToday: 'Open Today',
  setupQuickRecord: 'Quick record',
  setupQuickTask: 'Quick task',
  setupRemoveExamples: 'Remove untouched example',
  setupExamplesRemoved: 'The untouched example was removed.',
  setupExamplesPreserved: 'The example was edited, so LifeOS kept it.',
  setupCommand: 'Set up workspace',
  quickRecordCommand: 'Quick record',
  quickTaskCommand: 'Quick task',
  quickRecordTitle: 'Quick record',
  quickTaskTitle: 'Quick task',
  quickRecordPlaceholder: 'Capture an idea, note, or update…',
  quickTaskPlaceholder: 'What needs to be done?',
  quickCaptureDescription: "Saved under the daily record section in today's note. Press Ctrl/Cmd + Enter to save.",
  quickCaptureSubmit: 'Save',
  quickCaptureWorking: 'Saving…',
  quickCaptureEmpty: 'Enter some content first.',
  quickCaptureSuccess: "Saved to today's note.",
  quickCaptureFailed: "Could not save to today's note",
  templateDailyTitle: 'Daily note',
  templateWeeklyTitle: 'Weekly review',
  templateMonthlyTitle: 'Monthly review',
  templateQuarterlyTitle: 'Quarterly review',
  templateYearlyTitle: 'Yearly review',
  templateTasksRecorded: 'Tasks recorded',
  templateTasksCompleted: 'Tasks completed',
  templateDailyRecords: 'Daily records',
  templateProjects: 'Projects',
  templateAreas: 'Areas',
  templateOverview: 'Overview',
  templateTasks: 'Tasks',
  templateRecords: 'Records',
  templateFiles: 'Files',
};

const ZH: FeatureI18n = {
  setupTitle: '初始化 LifeOS',
  setupDescription: '安装安全的基础工作区，完成后即可创建并使用今日日记。',
  setupLanguage: '模板语言',
  setupLanguageDescription: '决定生成目录、模板和上手指南所使用的语言。',
  setupMode: '工作区模式',
  setupPeriodicOnly: '仅使用周期笔记',
  setupPeriodicOnlyDescription: '用于日常记录和周期复盘，不创建 PARA 目录。',
  setupPara: '周期笔记 + PARA',
  setupParaDescription: '在周期工作流中加入项目、领域、资源和存档。',
  setupSafety: '只创建缺失的目录和模板，绝不会覆盖已有文件。',
  setupPreview: '本次将准备的文件',
  setupBestFor: '适合',
  setupNotFor: '不太适合',
  setupDailyFlow: '日常流程',
  setupIncludeExamples: '包含一个示例工作流',
  setupIncludeExamplesDescription: '创建一份独立示例；只要没有修改，之后可安全移除。',
  setupLocked: '该工作区已经选择模板与语言，将继续沿用已有结构。',
  setupLater: '稍后',
  setupSubmit: '初始化并创建今日日记',
  setupWorking: '正在初始化…',
  setupSuccess: (createdCount, skippedCount) =>
    `LifeOS 已就绪：新建 ${createdCount} 项，保留 ${skippedCount} 项已有内容。`,
  setupFailed: 'LifeOS 初始化失败',
  setupCompleteTitle: '工作区已经就绪',
  setupCompleteDescription: '现在用一条真实内容完成首次闭环，五分钟就够。',
  setupOpenGuide: '打开上手指南',
  setupOpenToday: '打开 Today',
  setupQuickRecord: '快速记录',
  setupQuickTask: '快速任务',
  setupRemoveExamples: '移除未修改的示例',
  setupExamplesRemoved: '未修改的示例已移除。',
  setupExamplesPreserved: '示例已经被修改，因此 LifeOS 保留了它。',
  setupCommand: '初始化工作区',
  quickRecordCommand: '快速记录',
  quickTaskCommand: '快速任务',
  quickRecordTitle: '快速记录',
  quickTaskTitle: '快速任务',
  quickRecordPlaceholder: '记录一个想法、进展或闪念…',
  quickTaskPlaceholder: '接下来要做什么？',
  quickCaptureDescription: '内容会写入今日日记的日常记录标题下。按 Ctrl/Cmd + Enter 保存。',
  quickCaptureSubmit: '保存',
  quickCaptureWorking: '正在保存…',
  quickCaptureEmpty: '请先输入内容。',
  quickCaptureSuccess: '已保存到今日日记。',
  quickCaptureFailed: '无法保存到今日日记',
  templateDailyTitle: '日记',
  templateWeeklyTitle: '周复盘',
  templateMonthlyTitle: '月复盘',
  templateQuarterlyTitle: '季度复盘',
  templateYearlyTitle: '年度复盘',
  templateTasksRecorded: '记录的任务',
  templateTasksCompleted: '完成的任务',
  templateDailyRecords: '日常记录',
  templateProjects: '项目',
  templateAreas: '领域',
  templateOverview: '概览',
  templateTasks: '任务',
  templateRecords: '记录',
  templateFiles: '文件',
};

const ZH_TW: FeatureI18n = {
  ...ZH,
  setupTitle: '初始化 LifeOS',
  setupDescription: '安裝安全的基礎工作區，完成後即可建立並使用今日日記。',
  setupLanguage: '範本語言',
  setupLanguageDescription: '決定產生資料夾、範本和入門指南所使用的語言。',
  setupMode: '工作區模式',
  setupPeriodicOnly: '僅使用週期筆記',
  setupPeriodicOnlyDescription: '用於日常記錄和週期回顧，不建立 PARA 目錄。',
  setupPara: '週期筆記 + PARA',
  setupParaDescription: '在週期工作流程中加入專案、領域、資源和封存。',
  setupSafety: '只建立缺少的目錄和範本，絕不覆蓋已有檔案。',
  setupPreview: '本次將準備的檔案',
  setupBestFor: '適合',
  setupNotFor: '不太適合',
  setupDailyFlow: '日常流程',
  setupIncludeExamples: '包含一個範例工作流程',
  setupIncludeExamplesDescription: '建立一份獨立範例；只要沒有修改，之後可安全移除。',
  setupLocked: '該工作區已經選擇範本與語言，將繼續沿用既有結構。',
  setupLater: '稍後',
  setupSubmit: '初始化並建立今日日記',
  setupWorking: '正在初始化…',
  setupSuccess: (createdCount, skippedCount) =>
    `LifeOS 已就緒：新建 ${createdCount} 項，保留 ${skippedCount} 項既有內容。`,
  setupCompleteTitle: '工作區已經就緒',
  setupCompleteDescription: '現在用一條真實內容完成首次閉環，五分鐘就夠。',
  setupOpenGuide: '開啟入門指南',
  setupOpenToday: '開啟 Today',
  setupQuickRecord: '快速記錄',
  setupQuickTask: '快速任務',
  setupRemoveExamples: '移除未修改的範例',
  setupExamplesRemoved: '未修改的範例已移除。',
  setupExamplesPreserved: '範例已經被修改，因此 LifeOS 保留了它。',
  quickRecordCommand: '快速記錄',
  quickTaskCommand: '快速任務',
  quickRecordTitle: '快速記錄',
  quickTaskTitle: '快速任務',
  quickRecordPlaceholder: '記錄一個想法、進展或閃念…',
  quickTaskPlaceholder: '接下來要做什麼？',
  quickCaptureDescription: '內容會寫入今日日記的日常記錄標題下。按 Ctrl/Cmd + Enter 儲存。',
  quickCaptureSubmit: '儲存',
  quickCaptureWorking: '正在儲存…',
  quickCaptureEmpty: '請先輸入內容。',
  quickCaptureSuccess: '已儲存到今日日記。',
  quickCaptureFailed: '無法儲存到今日日記',
  templateDailyTitle: '日記',
  templateWeeklyTitle: '週回顧',
  templateMonthlyTitle: '月回顧',
  templateQuarterlyTitle: '季度回顧',
  templateYearlyTitle: '年度回顧',
  templateTasksRecorded: '記錄的任務',
  templateTasksCompleted: '完成的任務',
  templateDailyRecords: '日常記錄',
  templateProjects: '專案',
  templateAreas: '領域',
  templateOverview: '概覽',
  templateTasks: '任務',
  templateRecords: '記錄',
  templateFiles: '檔案',
};

export function getFeatureI18n(locale?: string): FeatureI18n {
  const normalized = normalizeWorkspaceLocale(locale);

  if (normalized === 'zh-tw') return ZH_TW;
  if (normalized.startsWith('zh')) return ZH;

  const translations = { de, es, fr, pt, ja, ko, ar };
  const copy = translations[normalized as keyof typeof translations];
  if (!copy) return EN;
  return {
    ...copy,
    setupSuccess: (created, skipped) =>
      copy.setupSuccess.replace('{created}', String(created)).replace('{skipped}', String(skipped)),
  };
}
