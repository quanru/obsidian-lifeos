# 开源版 1.29.2 候选验收

本轮完成首次使用入口、主题空列表提示、示例库与官网文档对齐，以及依赖安全修复。代码在 main 本地开发，尚未提交、推送或发布。

## 改动

- 首次使用可直接进入快速记录，仅补建缺失的基础日记模板。已有模板保留，不生成示例内容或工作区模式档案；失败时保留向导并提示原因。
- 主题列表为空时显示创建路径、主题启用条件，以及主题指南和示例库入口。关闭选择器保留草稿。
- 新生成的周期和主题查询使用 LifeOSOpen，明确调用开源实现；现有笔记不自动改写。
- 实测发现 Obsidian 1.4.5 没有 getFileByPath/getFolderByPath，改用 getAbstractFileByPath 并检查文件类型。Memos 身份解析辅助函数拆出，DailyRecord.ts 保持 599 行。
- Moment 升至 2.31.0，开发依赖链中的 devalue 固定为 5.9.3。审计从 8 项漏洞降为 0。
- 1.29.2 的最低 Obsidian 版本明确为 1.4.5。此前版本记录和已发布的 1.29.1 不修改。

## 已通过

- 生产构建、93 项测试、触及文件的格式与 lint 检查。
- Obsidian 1.14.4：普通主题默认值、共用标签独立选择、搜索恢复、键盘勾选、窄屏触控目标、短窗口保存、主题跳转、任务回写、内部 ID 隐藏、历史重读。
- 官方 Obsidian 1.4.5 macOS 安装包的隔离实例：快速记录保存、独立 LifeOSOpen 主题查询、真实点击任务勾选并确认 Markdown 写回。没有模拟宿主版本，也未替换正式插件逻辑。
- 中英文空白库：首次记录保存、无 Dataview 时正常使用、关闭主题选择器保留输入、不创建工作区模式档案。
- 独立示例库：10 种语言、40 个模板目录、930 个生成文件校验通过。生成时使用 update-only，不删除其他任务的主题资源与本地资料。
- 官网：中英文对比页更新到已发布的 1.29.1，主题指南和模板语法解释独立 namespace；本地生产构建与 Ego Lite 浏览器检查通过。未部署。
- Chrome 发布客户端密钥：新密钥通过 token 交换和 publisher 只读 API（HTTP 200）；本机 shell 配置已更新，旧密钥停用并删除，旧密钥 token 交换返回 HTTP 401。没有发布 Chrome 扩展，未把凭据写入 Git 或验收附件。

## 移动端验收

按用户选择，改用 Android 真机 Redmi K30 Ultra 验收，不再等待 iPhone 的 Apple 账户本人确认。iOS 未实测通过，不作为本轮候选的阻塞项；Android 结果不代表 iOS 专属行为已验证。

在独立合成测试库安装最终 1.29.2 产物，核对 main.js、styles.css、manifest.json 的 SHA-256 与候选一致。首次使用直接进入快速记录；主题空列表显示创建方法和文档入口，关闭后草稿保留；系统键盘弹出时点击保存成功；强制停止并重新打开 Obsidian 后，Markdown 内容与快速记录列表均保留。测试库没有安装 Dataview，仅生成基础日记模板，没有生成工作区模式档案。原测试库已完整备份，没有修改真实笔记库。操作完成已释放 Android 设备锁。

## 发布状态

本轮本地候选验收完成。尚未提交、推送或发布，推送继续遵守用户逐次同意的约定。

## 证据

结构化记录见 onboarding-2026-10-12.json。真实截图包括：

- docs/assets/getting-started/first-use-zh.png
- docs/assets/getting-started/first-use-en.png
- docs/assets/getting-started/empty-theme-zh.png
- docs/assets/getting-started/empty-theme-en.png
- .verify/onboarding-2026-10-12/android/first-use-ready.png
- .verify/onboarding-2026-10-12/android/empty-theme.png
- .verify/onboarding-2026-10-12/android/keyboard-before-save.png
- .verify/onboarding-2026-10-12/android/saved-with-keyboard.png
- .verify/onboarding-2026-10-12/android/capture-after-restart-visible.png
- .verify/onboarding-2026-10-12/legacy/theme-task-writeback.png
- .verify/onboarding-2026-10-12/site-comparison.png
- .verify/onboarding-2026-10-12/site-comparison-en.png

本轮仅对已覆盖路径声明兼容性；未声称完整测试 Windows、全部 Memos 服务版本或 Obsidian 1.4.0 内测版。iOS 本人认证截图含个人信息，仅保留于被忽略的本地目录，不进入公开仓库。

## 记录与任务选中态调整

选中按钮改为主题色文字和 12% 主题色浅底，并把样式限制在记录类型切换按钮内。旧宿主不支持 color-mix 时使用 Obsidian 的背景变量回退。生产构建和格式检查通过；Android 真机亮色、暗色下分别切换记录与任务，选中状态及标题正常。仅 CSS 产物改变，JavaScript 和 manifest 哈希未变；此前业务验证保留原产物哈希，本次外观验证绑定更新后的 CSS。测试库外观设置已恢复，未推送发布。

截图：.verify/capture-kind-2026-10-12/record-keyboard.png、task-selected.png、dark-record.png、dark-task.png。

## 全部开源控件配色对齐

在本轮按钮调整的基础上，创建笔记的日期选择和标记、创建操作，以及首次使用、设置和主题选择器的原生操作按钮也统一为浅底。最终使用 10% 半透明强调色和 16% 悬停填充，文字融合主题强调色与正常文字；暗色下填充跟随面板背景，不混入页面的纯黑背景。中英文首次使用活验证通过，教程截图已换成当前实现；安卓真机分别核对记录、任务和保存按钮的亮暗色效果，已恢复测试库外观设置并释放设备锁。构建通过，未推送发布。
