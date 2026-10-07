export const WORKSPACE_LANGUAGES = {
  en: 'English',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
} as const;
export type WorkspaceLocale = keyof typeof WORKSPACE_LANGUAGES;
export function normalizeWorkspaceLocale(locale?: string): WorkspaceLocale {
  const normalized = locale?.trim().toLowerCase().replace(/_/g, '-') ?? 'en';
  if (/^zh-(hant|tw|hk|mo)(-|$)/.test(normalized)) return 'zh-tw';
  if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-cn';
  const language = normalized.split('-')[0];
  return Object.prototype.hasOwnProperty.call(WORKSPACE_LANGUAGES, language) ? (language as WorkspaceLocale) : 'en';
}
