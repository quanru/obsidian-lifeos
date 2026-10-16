import messages from './entry-messages.json';
import { normalizeWorkspaceLocale } from './locale';
export const entryMessages = (locale: string) => messages[normalizeWorkspaceLocale(locale)];
