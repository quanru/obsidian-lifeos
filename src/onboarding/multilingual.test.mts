import assert from 'node:assert/strict';
import test from 'node:test';
import { captureMessages } from '../capture/messages.ts';
import { getI18n, getDayjsLocale, getAntdLocale } from '../i18n.ts';
import { memoryApp, settings } from '../../tests/vault.ts';
import { WORKSPACE_LANGUAGES, normalizeWorkspaceLocale } from './locale.ts';
import { getLocalizedWorkspaceSettings, getBasicTemplatePlans } from './templates.ts';
import { initializeWorkspace, readWorkspaceProfile } from './workspace.ts';
import { getFeatureI18n } from '../feature-i18n.ts';
import { dependencyMessages } from '../dependencies/messages.ts';

test('regional locales retain their workspace language and unknown languages fall back', () => {
  assert.equal(normalizeWorkspaceLocale(' zh_Hant_HK '), 'zh-tw');
  assert.equal(normalizeWorkspaceLocale('zh-MO'), 'zh-tw');
  assert.equal(normalizeWorkspaceLocale('pt_BR'), 'pt');
  assert.equal(normalizeWorkspaceLocale('ko-KR'), 'ko');
  assert.equal(normalizeWorkspaceLocale('ja-JP'), 'ja');
  assert.equal(normalizeWorkspaceLocale('xx'), 'en');
  assert.equal(normalizeWorkspaceLocale('constructor'), 'en');
  assert.equal(getI18n('ko-KR').Daily, '일');
  assert.equal(getDayjsLocale('ko-KR'), 'ko');
  assert.equal(getAntdLocale('ko-KR').locale, 'ko');
});

test('all workspace languages round-trip, preserve custom files, and reject language changes', async () => {
  for (const locale of Object.keys(WORKSPACE_LANGUAGES)) {
    const { app, contents } = memoryApp();
    const localized = getLocalizedWorkspaceSettings(settings, locale);
    await initializeWorkspace(app, localized, 'para', locale);
    assert.equal((await readWorkspaceProfile(app))?.locale, locale);
    const plans = getBasicTemplatePlans(localized, 'para', locale);
    assert(plans[0].content.includes(`## ${localized.dailyRecordHeader}`));
    contents.set(plans[0].path, 'My customized template');
    await initializeWorkspace(app, localized, 'para', locale);
    assert.equal(contents.get(plans[0].path), 'My customized template');
    await assert.rejects(initializeWorkspace(app, localized, 'para', locale === 'en' ? 'ja' : 'en'));
  }
});

test('new feature and dependency messages do not silently fall back to English', () => {
  const feature = getFeatureI18n('en');
  const dependency = dependencyMessages('en');
  for (const locale of Object.keys(WORKSPACE_LANGUAGES).filter((locale) => locale !== 'en')) {
    const f = getFeatureI18n(locale),
      r = dependencyMessages(locale);
    assert.notEqual(f.setupTitle, feature.setupTitle, locale);
    assert.notEqual(f.setupSuccess(7, 3), feature.setupSuccess(7, 3), locale);
    assert(f.setupSuccess(7, 3).includes('7') && f.setupSuccess(7, 3).includes('3'));
    assert.notEqual(r.missing, dependency.missing, locale);
    const capture = captureMessages(locale);
    assert.notEqual(capture.title, captureMessages('en').title, locale);
    assert.deepEqual(Object.keys(capture).sort(), Object.keys(captureMessages('en')).sort());
    assert.deepEqual(Object.keys(r).sort(), Object.keys(dependency).sort());
  }
});
