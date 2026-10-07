import { type CaptureTheme, applyThemeSelection, inlineThemeTags } from './theme-model';

export function defaultThemePaths(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((path): path is string => typeof path === 'string' && !!path.trim()).map((path) => path.trim()),
        ),
      ]
    : [];
}

export function defaultCaptureDraft(themes: CaptureTheme[], value: unknown): string {
  const text = applyThemeSelection('', themes, [], defaultThemePaths(value));
  return text ? `${text}\n` : '';
}

// A preset is a starting point, not a record to save by itself.
export function hasCaptureBody(text: string, preset: string): boolean {
  const defaults = new Set(inlineThemeTags(preset).map((span) => span.tag));
  let body = text;
  for (const span of inlineThemeTags(text).reverse()) {
    if (defaults.has(span.tag)) body = body.slice(0, span.start) + body.slice(span.end);
  }
  return !!body.trim();
}
