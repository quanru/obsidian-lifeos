import assert from 'node:assert/strict';
import test from 'node:test';
import { GlobalHelperPublisher, registerQueryLanguages } from './integration.ts';

test('shared query language conflicts leave the plugin-specific query registered', () => {
  const registered: string[] = [];
  registerQueryLanguages((language) => {
    if (language !== 'LifeOSOpen')
      throw new Error(`Code block postprocessor for language ${language} is already registered`);
    registered.push(language);
  });
  assert.deepEqual(registered, ['LifeOSOpen']);
  assert.throws(
    () =>
      registerQueryLanguages(() => {
        throw new Error('Host unavailable');
      }),
    /Host unavailable/,
  );
  const languages: string[] = [];
  registerQueryLanguages((language) => languages.push(language));
  assert.deepEqual(languages, ['LifeOSOpen', 'PeriodicPARA', 'LifeOS']);
});

test('global helpers keep an existing owner intact across settings updates and unload', () => {
  const other = {};
  const globals: { LifeOSOpen?: object; LifeOS?: object; PeriodicPARA?: object } = {
    LifeOS: other,
    PeriodicPARA: other,
  };
  const publisher = new GlobalHelperPublisher(globals);
  publisher.publish({ version: 1 });
  publisher.publish({ version: 2 });
  assert.equal(globals.LifeOS, other);
  assert.deepEqual(globals.LifeOSOpen, { version: 2 });
  assert.equal(globals.PeriodicPARA, other);
  publisher.clear();
  assert.equal(globals.LifeOS, other);
  assert.equal(globals.LifeOSOpen, undefined);
});

test('owned global aliases refresh and clean up without removing a later owner', () => {
  const globals: { LifeOSOpen?: object; LifeOS?: object; PeriodicPARA?: object } = {};
  const publisher = new GlobalHelperPublisher(globals);
  publisher.publish({ version: 1 });
  publisher.publish({ version: 2 });
  assert.equal(globals.LifeOS, globals.PeriodicPARA);
  const later = {};
  globals.LifeOS = later;
  publisher.clear();
  assert.equal(globals.LifeOS, later);
  assert.equal(globals.PeriodicPARA, undefined);
});
