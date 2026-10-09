import { normalizeWorkspaceLocale } from '../onboarding/locale';
import translations from './translations.json';

export function productMessages(locale: string) {
  return translations[normalizeWorkspaceLocale(locale)];
}
