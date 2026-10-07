import assert from 'node:assert/strict';
import test from 'node:test';
import { settings } from '../../tests/vault.ts';
import { themeTags, identifyTheme, matchedThemes, applyThemeSelection, inlineThemeTags, type CaptureTheme } from './theme-model.ts';
import { themeMessages } from './theme-messages.ts';
import { WORKSPACE_LANGUAGES } from '../onboarding/locale.ts';
const themes: CaptureTheme[] = [
 {path:'Projects/Launch/README.md',name:'Launch',kind:'project',tags:['work','launch']},
 {path:'Areas/Work/README.md',name:'Work',kind:'area',tags:['work']},
 {path:'Resources/Notes/README.md',name:'Notes',kind:'resource',tags:['notes']},
];
test('theme discovery follows configured PARA index style and excludes template notes',()=>{
 assert.deepEqual(identifyTheme(themes[0].path,{...settings,paraIndexFilename:'readme'}),{path:themes[0].path,name:'Launch',kind:'project'});
 assert.equal(identifyTheme('Projects/Launch/Notes.md',settings),undefined);
 assert.equal(identifyTheme('Projects/Launch/Sub/README.md',settings),undefined);
 assert.equal(identifyTheme(themes[0].path,{...settings,projectsTemplateFilePath:themes[0].path}),undefined);
 assert.equal(identifyTheme('Projects/Launch/Launch.md',{...settings,paraIndexFilename:'folderName'})?.name,'Launch');
 assert.equal(identifyTheme(themes[0].path,{...settings,paraIndexFilename:'folderName'}),undefined);
});
test('normalizes supported YAML tag forms while rejecting malformed tags',()=>{
 assert.deepEqual(themeTags(['#work','work','计划/发布',42,'two words','123']),['work','计划/发布']);
 assert.deepEqual(themeTags('work, launch #计划'),['work','launch','计划']);
});
test('association requires all theme tags and does not count examples, links or escaped text',()=>{
 const text='#work #launch #personal\n`#notes` [[#notes]] [#notes](url) \\#notes\n```\n#notes\n```';
 assert.deepEqual(matchedThemes(text,themes).map(t=>t.name),['Launch','Work']);
 assert.deepEqual(inlineThemeTags(text).map(t=>t.tag),['work','launch','personal']);
 assert.deepEqual(inlineThemeTags('~~~md\n#notes'),[]);
});
test('changing associations keeps shared and unrelated tags and leaves Markdown examples unchanged',()=>{
 const text='Thought #work #launch #personal\n`#launch`\n```\n#launch\n```';
 const next=applyThemeSelection(text,themes,[themes[0].path,themes[1].path],[themes[1].path,themes[2].path]);
 assert.ok(next.startsWith('#notes\n'));assert.match(next,/#work/);assert.match(next,/#personal/);
 assert.ok(!next.split('\n')[1].includes('#launch'));assert.match(next,/`#launch`/);assert.match(next,/```\n#launch\n```/);
 assert.deepEqual(matchedThemes(next,themes).map(t=>t.name),['Work','Notes']);
});
test('adds new association outside an unclosed fence and never duplicates existing tags',()=>{
 const next=applyThemeSelection('```js\n#notes',themes,[],[themes[2].path]);
 assert.equal(next,'#notes\n```js\n#notes');
 assert.equal(applyThemeSelection('#notes text',themes,[],[themes[2].path]),'#notes text');
});
test('removes only association tags with CRLF and preserves note links and task text',()=>{
 const text='- [ ] #work Task\r\n[[Project]] #launch #personal\r\n';
 const next=applyThemeSelection(text,themes,[themes[0].path],[]);
 assert.equal(next,'- [ ]  Task\r\n[[Project]]  #personal\r\n');
});
test('new editor and theme messages cover every supported language',()=>{
 const keys=Object.keys(themeMessages('en')).sort();
 for(const locale of Object.keys(WORKSPACE_LANGUAGES)) {assert.deepEqual(Object.keys(themeMessages(locale)).sort(),keys);if(locale!=='en')assert.notEqual(themeMessages(locale).associate,themeMessages('en').associate);}
});
