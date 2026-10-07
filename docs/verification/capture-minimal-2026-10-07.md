# 快速记录简化交互验收

本轮在开源仓库独立实现，进一步简化此前的交互对齐方案，没有复制 Pro / Aino 源码、共享包、依赖配置或构建产物。

## 当前交互

- 输入区底部只保留主题关联和保存；编辑历史卡片时增加取消。移除格式按钮、更多工具、独立预览、文件上传入口、类型切换和常驻源码按钮。
- 源码与实时预览切换放进编辑区的 Obsidian 原生右键菜单，只作用于当前草稿，关闭编辑器时注销监听。
- 格式使用 Markdown 或宿主快捷键。补齐未保存编辑器的宿主上下文及弹窗快捷键作用域，让配置的编辑命令作用于当前草稿。关闭内联编辑后恢复顶部草稿上下文，关闭窗口后恢复原编辑器，草稿不自动写入日记。
- 记录和任务分别由各自命令进入，任务标题明确标注类型。连续保存保留命令类型，下一条草稿仍初始化默认主题。
- 图片从系统剪贴板直接粘贴，沿用 Obsidian 附件位置和链接格式，不再提供重复的上传按钮。

## 验证方法与边界

67 项完整测试、TypeScript 检查、生产构建、定向 Biome 检查及 `git diff --check` 通过。

在 macOS Obsidian 1.14.3 使用独立 profile / scratch vault 与 mock keychain，无 Dataview，不读取真实笔记。自动化使用本机已有 Electron / Playwright 工具，不将它们加入开源产品依赖。

实测底部仅两个按钮、卡片编辑增加取消、65 条跨六天记录的日期分组和滚动加载、日期快捷选项与自定义范围、标签筛选、内联编辑、外部刷新保留草稿、源修改拒绝覆盖、顶部草稿保持、复制及双击来源。任务命令连续保存保持任务类型，完成状态与复制内容保留。

源码菜单切换保留选区，原生 Cmd+B、Cmd+Enter、Esc 使用真实按键验证。关闭仍在编辑的卡片不会写入日记，关闭后宿主恢复原编辑器。系统剪贴板放入合成图片后按 Cmd+V，验证附件只创建一份并正确写入记录。renderer 无错误。

macOS 系统菜单不出现在页面 DOM 中，因此测试库通过 Obsidian 公开的 `Menu.setUseNativeMenu(false)` 使用 DOM 菜单，点击同一菜单项进行验证；产品代码保留宿主默认菜单。该结果不冒充系统原生菜单的自动点击证据。

十种语言的输入窗口与主题弹窗通过检查，中文和阿语 480px 窄窗口已截图。最低支持版本和移动端尚未实测。

## 证据

绝对目录：`/Volumes/T5/personal/obsidian-lifeos/.verify/capture-minimal-20261007/`。

`results.json` 与 `locales/results.json` 记录被测产物 SHA-256；`artifacts/` 保存同仓库产物快照，`source-inputs.json` 记录源码指纹。保留本机自动化脚本 `runtime.mjs`、`locales.mjs` 及合成图片 `fixture.png`。

关键截图：`zh-cn-capture.png`、`zh-cn-editor-menu.png`、`zh-cn-inline-edit.png`、`zh-cn-narrow.png`、`zh-cn-pasted-image.png`、`locales/ar-narrow.png`。

本次临时实例、profile 和库已清理，runtime 名额已释放，未触发远程 CI。本会话未执行提交、推送或发布；其他会话的发布状态以其回执为准。
