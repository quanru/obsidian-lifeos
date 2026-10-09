import { normalizeWorkspaceLocale } from '../onboarding/locale';
import translations from './messages.json';

export function dependencyMessages(locale?: string) {
  return translations[normalizeWorkspaceLocale(locale)];
}
