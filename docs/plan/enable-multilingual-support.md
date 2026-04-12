# 当前插件多语言支持实施方案

## 任务判断

- TRM: `Medium`
- 原因：当前仓库已经有 `src/i18n.ts`、`getI18n()`、`antd locale`、设置页 React 结构和若干接入点，不需要先做完整架构探索；但语言来源、设置项和多语言资源还没有真正串起来，属于中等规模的跨文件改造。

## 目标

参考 `/Users/leyang/personal/obsidian-lifeos-pro/apps/obsidian-plugin`，让当前插件具备真正可用的多语言能力：

1. 支持语言自动识别，并允许用户在插件设置中手动覆盖语言。
2. 支持与参考实现一致的主要语言集合：`en`、`zh-cn`、`zh-tw`、`de`、`es`、`fr`、`pt`/`pt-br`、`ja`、`ar`。
3. 让当前插件已有 UI、命令文案、提示文案、日期本地化使用统一语言来源，而不是零散读取 `window.localStorage.language`。

## 复用结果

### 当前仓库可直接复用

- `src/i18n.ts`
  - 已有中英文字典和 `getI18n()`。
- `src/context.ts` / `src/hooks/useApp.ts`
  - 已有 React context，可继续作为 UI 读语言的统一入口。
- `src/component/SettingTab/index.tsx`
  - 大部分设置页文案已经接了 `getI18n()`。
- `src/component/CreateNote/index.tsx`
  - 大部分创建页文案已经接了 `getI18n()`，主要问题是日期 locale 和少量 placeholder 仍写死。

### 参考实现中应复用的模式

- `packages/i18n/src/i18n.ts`
  - `normalizeLocale()`
  - `getLocale()`
  - `getAntdLocale()`
  - 语言 fallback 规则
- `apps/obsidian-plugin/src/view/SettingTab.tsx`
  - `settings.locale = ''`，空值表示跟随 Obsidian
- `apps/obsidian-plugin/src/component/SettingTab/tabs/ActivationTab.tsx`
  - 语言选择器设计
- `apps/obsidian-plugin/src/plugins/lifeos-pro/main.ts`
  - `syncLocale()` / `getCurrentLocaleKey()` 这类插件级语言同步方式

## 改动范围

需要同步修改的文件预计如下：

- `src/i18n.ts`
- `src/type.ts`
- `src/view/SettingTab.tsx`
- `src/component/SettingTab/index.tsx`
- `src/main.ts`
- `src/util.ts`
- `src/component/CreateNote/index.tsx`
- `src/periodic/DailyRecord.ts`
- `src/periodic/Bullet.ts`
- `src/periodic/File.ts`
- `src/periodic/Task.ts`
- `src/component/TopBanner/index.tsx`
- 如有必要：`README.md` / `README-ZH.md`

## 实施方案

### 1. 统一语言解析入口

在 `src/i18n.ts` 中把当前简单映射升级为“参考实现的轻量版”：

- 新增 `normalizeLocale(locale?: string)`：
  - 统一大小写、下划线转横线。
  - 把 `zh-Hans`、`zh_CN`、`zh-SG` 归一到 `zh-cn`。
  - 把 `zh-Hant`、`zh-TW`、`zh-HK` 归一到 `zh-tw`。
  - 把 `pt-BR` 归一到 `pt-br`。
- 新增 `getLocale()`：
  - 优先取 Obsidian/moment 当前语言。
  - 其次取 `window.localStorage.language`。
  - 最后回退 `navigator.language`。
- 新增 `getAntdLocale()`：
  - 返回当前语言对应的 antd locale。
- `getI18n()` 改为返回 `EN + 当前语言字典` 的合并结果：
  - 避免新增语言缺失某个 key 时出现 `undefined`。

### 2. 扩展多语言资源

在 `src/i18n.ts` 中将当前仅有的 `EN` / `ZH` 扩展为以下资源：

- `EN`
- `ZH`
- `ZH_TW`
- `DE`
- `ES`
- `FR`
- `PT`
- `JA`
- `AR`

处理方式：

- 先复用参考仓库 `packages/i18n/src/locales/*` 中已有的通用翻译。
- 对当前插件特有、参考仓库不存在的 key，补齐当前插件所需翻译。
- 所有当前插件已使用的 key 都必须在资源里有值，不能只靠运行时“碰运气”。

### 3. 把语言设置变成插件设置项

在 `src/type.ts` 和 `src/view/SettingTab.tsx` 中加入：

- `locale: string`
- 默认值：`''`

语义保持和参考实现一致：

- `''` 表示“自动”，跟随 Obsidian 当前语言。
- 显式值如 `de` / `fr` / `ja` 表示强制使用对应语言。

### 4. 在设置页加入语言选择器

在 `src/component/SettingTab/index.tsx` 中新增语言选择器，选项与参考实现保持一致：

- `Auto`
- `English`
- `Deutsch`
- `Español`
- `Français`
- `Português`
- `简体中文`
- `繁體中文`
- `日本語`
- `العربية`

并新增以下翻译键：

- `LANGUAGE`
- `LANGUAGE_HELP`
- `LANGUAGE_AUTO`
- 如需要保存提示，再补 `SETTINGS_SAVED`

### 5. 插件级同步 locale，而不是模块各自读 localStorage

在 `src/main.ts` 中移除当前顶层固定的：

- `const locale = window.localStorage.getItem('language') || 'en'`

改为插件实例级字段/方法：

- `this.locale`
- `this.i18n`
- `syncLocale(localeOverride?: string)`
- `getCurrentLocaleKey()`

使用方式：

- `loadSettings()` 时根据 `settings.locale` 或自动语言初始化。
- `saveSettings()` 时同步更新插件语言状态。
- 创建视图、设置页、命令文案、ribbon 文案时，全部从插件当前语言读取。

### 6. 修正 UI 和日期本地化接入点

重点修正以下问题：

- `src/component/CreateNote/index.tsx`
  - 替换 `window.localStorage.getItem('language')`。
  - 日期组件统一走“当前生效语言”。
  - 补齐仍写死的 placeholder，例如 `PKM/LifeOS`、`PKM-LifeOS`、`LifeOS.README.md`。
  - `班` / `休` 这种农历日历标识要进入 i18n。
- `src/util.ts`
  - `createPeriodicFile()` 不再直接读 localStorage。
  - `openOfficialSite()` 兼容 `zh`、`zh-cn`、`zh-tw`，其他语言默认英文站。
- `src/main.ts`
  - 命令、ribbon、SettingTab、错误提示统一使用插件当前语言。
- `src/component/TopBanner/index.tsx`
  - 继续走 `getI18n(locale)`，新增语言默认落英文链接，中文仍走中文站。

### 7. 保持默认行为稳定

以下行为必须保持向后兼容：

- 不设置 `locale` 时，默认仍然自动跟随 Obsidian/系统语言。
- 原有中文和英文用户不需要手动配置就能继续使用。
- 现有 `getI18n()` key 名不改，避免现有组件调用点一起重写。
- 若某个新增语言暂缺个别文案，至少回退英文，不出现空白或 `undefined`。

## 风险与遗漏

### 风险 1：语言切换后已注册命令/功能区按钮名称不会完全实时刷新

原因：

- Obsidian 命令和 ribbon 文案是在 `onload()` 时注册的。

处理：

- 本次实现保证“重新加载插件后”命令文案正确。
- 设置页和新打开的视图可做到实时使用新语言。
- 如果过程中发现现有 API 能安全刷新，再补即时刷新；否则保留为已知限制。

### 风险 2：dayjs locale 未导入会导致日期仍显示英文

处理：

- 需要补充当前支持语言对应的 dayjs locale import，至少覆盖本次新增语言。

### 风险 3：新增语言词典可能漏 key

处理：

- `getI18n()` 做 `EN` 合并 fallback。
- 实施时对当前仓库实际使用的 i18n key 做一次 grep，确保接入面和资源面一致。

### 风险 4：设置页切换语言时当前页不立即刷新

处理：

- 实施时优先尝试在 `saveSettings()` 后触发设置页重新渲染。
- 如果现有结构下代价过高，则至少保证关闭再打开设置页后立即生效，并在结果里明确说明。

### 依赖决策

- 不引入新的 i18n 依赖。
- 直接在当前仓库移植参考实现的 locale 规范化逻辑和当前插件需要的语言资源。
- 原因：当前仓库不是 monorepo workspace 结构，直接依赖 `@lifeos/i18n` 并不划算，也会引入无关包耦合。

## 待办清单

1. 重构 `src/i18n.ts`，补齐 locale 规范化、antd locale 映射和多语言资源。
2. 为 `PluginSettings` 增加 `locale` 配置，并更新默认值。
3. 在设置页加入语言选择器和相关翻译文案。
4. 在 `main.ts` 建立插件级语言同步逻辑，替换现有全局 `locale` 常量。
5. 修正 `CreateNote`、`util.ts`、`periodic/*` 中直接读取 localStorage 或写死文案的地方。
6. 补充 dayjs locale 导入，验证多语言日期显示。
7. 运行构建检查，并视结果补 README 中的语言支持说明。
