import { normalizeWorkspaceLocale } from '../onboarding/locale';
import translations from './settings-translations.json';
export type CaptureSettingsMessages = typeof translations.en;
export function captureSettingsMessages(locale: string): CaptureSettingsMessages {
  return translations[normalizeWorkspaceLocale(locale)];
}
