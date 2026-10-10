import { getFeatureI18n } from '../feature-i18n';
import { themeSettingsMessages } from './messages';
export function buildThemeTemplate(locale: string): string {
  const t = getFeatureI18n(locale);
  return [
    `# ${t.templateOverview}`,
    '',
    `## ${t.templateTasks}`,
    '',
    '```LifeOS\nTaskListByTag\n```',
    '',
    `## ${t.templateRecords}`,
    '',
    '```LifeOS\nBulletListByTag\n```',
    '',
    `## ${t.templateFiles}`,
    '',
    '```LifeOS\nFileListByTag\n```',
    '',
    `## ${themeSettingsMessages(locale).title}`,
    '',
    '```LifeOS\nThemeListByTag\n```',
    '',
  ].join('\n');
}
