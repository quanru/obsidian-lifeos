import { normalizeWorkspaceLocale } from '../onboarding/locale';
import translations from './interaction-translations.json';
export function interactionMessages(locale: string) {
  return translations[normalizeWorkspaceLocale(locale)];
}
