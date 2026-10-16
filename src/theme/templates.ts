import { getFeatureI18n } from '../feature-i18n';
import { themeSettingsMessages } from './messages';
export function buildThemeTemplate(locale: string): string {
  const t = getFeatureI18n(locale);
  return [
    `# ${t.templateOverview}`,
    '',
    `## ${t.templateTasks}`,
    '',
    '```LifeOSOpen\nTaskOpenListByTag\n```',
    '',
    `## ${t.templateRecords}`,
    '',
    '```LifeOSOpen\nBulletListByTag\n```',
    '',
    `## ${t.templateFiles}`,
    '',
    '```LifeOSOpen\nFileListByTag\n```',
    '',
    `## ${themeSettingsMessages(locale).title}`,
    '',
    '```LifeOSOpen\nThemeListByTag\n```',
    '',
  ].join('\n');
}
