import type { Locale } from 'antd/es/locale';
import arEG from 'antd/locale/ar_EG';
import deDE from 'antd/locale/de_DE';
import enUS from 'antd/locale/en_US';
import esES from 'antd/locale/es_ES';
import frFR from 'antd/locale/fr_FR';
import koKR from 'antd/locale/ko_KR';
import { KO } from './locales/ko';
import jaJP from 'antd/locale/ja_JP';
import ptBR from 'antd/locale/pt_BR';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import { EN } from './locales/en';
import { ZH } from './locales/zh';
import { ZH_TW } from './locales/zh_tw';
import { DE } from './locales/de';
import { ES } from './locales/es';
import { FR } from './locales/fr';
import { PT } from './locales/pt';
import { JA } from './locales/ja';
import { AR } from './locales/ar';
const I18N_MAP: Record<string, Record<string, string>> = {
  'en-us': EN,
  en: EN,
  'zh-cn': ZH,
  zh: ZH,
  'zh-tw': ZH_TW,
  de: DE,
  es: ES,
  fr: FR,
  pt: PT,
  'pt-br': PT,
  ja: JA,
  ko: KO,
  ar: AR,
};

export const localeMap: Record<string, Locale> = {
  en: enUS,
  'en-us': enUS,
  zh: zhCN,
  'zh-cn': zhCN,
  'zh-tw': zhTW,
  de: deDE,
  es: esES,
  fr: frFR,
  pt: ptBR,
  'pt-br': ptBR,
  ja: jaJP,
  ko: koKR,
  ar: arEG,
};

export function normalizeLocale(locale?: string) {
  const normalized = locale?.trim().toLowerCase().replace(/_/g, '-');

  if (!normalized) return 'en';
  if (normalized === 'zh') return 'zh';
  if (normalized.startsWith('zh-hans') || normalized.startsWith('zh-cn') || normalized.startsWith('zh-sg')) {
    return 'zh-cn';
  }
  if (
    normalized.startsWith('zh-hant') ||
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk') ||
    normalized.startsWith('zh-mo')
  ) {
    return 'zh-tw';
  }
  if (normalized.startsWith('pt-br')) return 'pt-br';
  if (normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('en-us')) return 'en-us';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('ko')) return 'ko';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ar')) return 'ar';

  return normalized;
}

export function getLocale() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const momentLocale = (window as Window & { moment?: { locale?: () => string } }).moment?.locale?.();
  const storedLocale = window.localStorage?.getItem('language');
  const navigatorLocale = window.navigator?.language;

  return normalizeLocale(momentLocale || storedLocale || navigatorLocale);
}

export function getAntdLocale(lang?: string) {
  return localeMap[normalizeLocale(lang)] || enUS;
}

export function getDayjsLocale(lang?: string) {
  const normalized = normalizeLocale(lang);

  if (normalized === 'en-us') return 'en';
  if (normalized === 'zh') return 'zh-cn';

  return normalized;
}

export function getI18n(lang?: string): Record<string, string> {
  return {
    ...EN,
    ...(I18N_MAP[normalizeLocale(lang)] || {}),
  };
}
